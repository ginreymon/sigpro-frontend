import { Component, DestroyRef, EventEmitter, Input, OnChanges, Output, SimpleChanges, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable, Subject, catchError, debounceTime, map, of, switchMap, tap } from 'rxjs';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { ManualBatchSimulation } from '../../../../../models/production/manual-batch-simulation';
import { ProductionRecord } from '../../../../../models/production/production-record';
import { StampingRecord } from '../../../../../models/stamping/stamping-record';
import { BoxLayout } from '../../../layout/box-layout/box-layout';
import { UiButton } from '../../../../elements/ui-button/ui-button';
import { UiIcon } from '../../../../elements/ui-icon/ui-icon';
import { UiHourInput } from '../../../../elements/ui-hour-input/ui-hour-input';
import { timeMinusMinutes } from '../../../../../common/functions/time-range';
import { extractFieldErrorMessage } from '../../../../../common/functions/session-errors';

// Shape shared by the two record variants this modal lists.
export type PendingReviewRecord = Partial<ProductionRecord> & Partial<StampingRecord>;

export interface ManualBatchConfirmation {
  start_time: string;
  end_time: string;
  duration_seconds: number;
}

// Single "Confirmar registro" modal of the manual-time batch flow: lists the
// records queued in the manual store (possibly several references / OPs),
// shows the read-only schedule, takes the total time spent and shows the
// limits and estimated efficiency computed by the backend. The backend is the
// only source of those numbers (no formula lives here): the form validators
// below only compare the typed time against what the backend answered.
@Component({
  selector: 'app-duration-schedule-modal',
  standalone: true,
  imports: [BoxLayout, UiButton, UiIcon, UiHourInput, ReactiveFormsModule],
  templateUrl: './duration-schedule-modal.html',
})
export class DurationScheduleModal implements OnChanges {
  @Input() visible = false;
  @Input() enable = true;

  // 'production' lists completadas/saldos/bajas; 'stamping' lists cantidad and
  // additional time minutes.
  @Input() variant: 'production' | 'stamping' = 'production';
  // Context shown in the header.
  @Input() referenceLabel = '';
  @Input() moduleLabel = '';
  // AdditionalStampingTime id -> standard_time (minutes per unit), used to total
  // the additional minutes of a stamping record ({id, count} only).
  @Input() additionalTimeMinutes: Record<number, number> = {};
  // true while the page persists the batch (confirm already pressed).
  @Input() saving = false;

  // Pending records of the store this modal saves, and the simulate callback
  // (production or stamping service) provided by the parent page.
  @Input() records: PendingReviewRecord[] = [];
  @Input() simulate: ((records: any[], durationSeconds: number | null) => Observable<ManualBatchSimulation>) | null = null;
  // Result of the pre-calculation already done by Guardar (no duration yet); shown on open without a second request.
  @Input() initialSimulation: ManualBatchSimulation | null = null;

  @Output() onConfirm = new EventEmitter<ManualBatchConfirmation>();
  @Output() onCancel = new EventEmitter<void>();
  // Index inside `records`, passed straight to the store's removeAt().
  @Output() onRemove = new EventEmitter<number>();

  private destroyRef = inject(DestroyRef);
  private simulate$ = new Subject<void>();
  protected simulation = signal<ManualBatchSimulation | null>(null);
  // true from the moment an estimate is requested until its (latest) response
  // arrives; confirming stays blocked meanwhile.
  protected loading = signal(false);
  // Server/communication error of the last estimate (null when it succeeded).
  protected simulationError = signal<string | null>(null);

  // The field is preloaded once per opening with the backend's recommended
  // time (the minimum that reaches the efficiency cap). `preloaded` marks that
  // value until the backend validates it; a value that fails is cleared.
  private preloadDone = false;
  private preloaded = false;
  // Why no recommended time could be preloaded (shown instead of a value).
  protected preloadMessage = signal<string | null>(null);

  // --- Reactive form --------------------------------------------------------
  // Validators read the signals above; they are re-run (see the effect in the
  // constructor) whenever the backend answer changes.
  private readonly positiveNumber: ValidatorFn = (control) => {
    const value = control.value;
    if (value === null || value === '') return null; // Validators.required reports it
    if (!Number.isFinite(Number(value))) return { notNumber: true };
    return Number(value) > 0 ? null : { notPositive: true };
  };

  // The checks below compare against the latest backend answer, so they only
  // apply once it is available and not stale.
  private answered(): ManualBatchSimulation | null {
    return this.loading() || this.simulationError() ? null : this.simulation();
  }

  private readonly minDuration: ValidatorFn = (control) => {
    const minutes = this.minutesOf(control);
    const min = this.minMinutes;
    return minutes !== null && min !== null && this.answered() && minutes < min ? { belowMin: { min } } : null;
  };

  private readonly maxDuration: ValidatorFn = (control) => {
    const minutes = this.minutesOf(control);
    const max = this.maxMinutes;
    return minutes !== null && max !== null && this.answered() && minutes > max ? { aboveMax: { max } } : null;
  };

  private readonly maxEfficiency: ValidatorFn = (control) => {
    const sim = this.answered();
    return this.minutesOf(control) !== null && sim && sim.efficiency !== null && sim.efficiency > sim.max_efficiency
      ? { efficiencyExceeded: { efficiency: sim.efficiency, max: sim.max_efficiency } }
      : null;
  };

  // Pre-calculation state: pending while the request runs, error when it failed
  // or came back without the data needed to validate the time.
  private readonly precalcState: ValidatorFn = (control) => {
    if (this.loading()) return { calculating: true };
    if (this.simulationError()) return { calcFailed: this.simulationError() };
    const sim = this.simulation();
    if (!sim || sim.max_duration_seconds === null) return { calcFailed: 'No hay información suficiente para validar el tiempo.' };
    return this.minutesOf(control) !== null && sim.efficiency === null
      ? { calcFailed: 'No se pudo estimar la eficiencia para este tiempo.' } : null;
  };

  // The start time derived from the duration must still fall inside the day.
  private readonly fitsInDay: ValidatorFn = (control) => {
    const minutes = this.minutesOf(control);
    return minutes !== null && timeMinusMinutes(this.endTime(), minutes) === null ? { startOutOfDay: true } : null;
  };

  protected durationCtrl = new FormControl<number | null>(null, [
    Validators.required, this.positiveNumber, this.minDuration, this.maxDuration, this.maxEfficiency,
    this.fitsInDay, this.precalcState,
  ]);
  protected form = new FormGroup({ duration_minutes: this.durationCtrl });

  // The end time is always "now" (read-only); the start time is derived from it.
  protected endTime = signal('');

  constructor() {
    // Debounced simulation; switchMap drops stale in-flight calls, so only
    // the latest response is applied.
    this.simulate$.pipe(
      debounceTime(300),
      map(() => (this.durationMinutes !== null ? this.durationMinutes * 60 : null)),
      switchMap(seconds => this.simulate
        ? this.simulate(this.records, seconds).pipe(
            map(result => ({ result, error: null as string | null })),
            catchError(err => of({
              result: null,
              error: extractFieldErrorMessage(err) ?? 'No hay comunicación con el servidor.',
            })),
          )
        : of({ result: null, error: 'No hay servicio de cálculo disponible.' })),
      tap(() => this.loading.set(false)),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(({ result, error }) => {
      this.simulation.set(result);
      this.simulationError.set(error);
      this.durationCtrl.updateValueAndValidity({ emitEvent: false });
      this.afterSimulation();
    });

    this.durationCtrl.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      if (this.visible) this.requestSimulation();
    });

    // Re-run the validators when the backend answer (or the clock) changes.
    effect(() => {
      this.simulation(); this.loading(); this.simulationError(); this.endTime();
      this.durationCtrl.updateValueAndValidity({ emitEvent: false });
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible']) {
      this.resetPreload();
      if (this.visible) {
        const now = new Date();
        this.endTime.set(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`);
      } else {
        this.form.reset({ duration_minutes: null }, { emitEvent: false });
        this.simulation.set(null);
        this.simulationError.set(null);
        this.loading.set(false);
      }
    } else if (changes['records'] && this.visible && !this.durationCtrl.dirty) {
      // The batch changed (a record was removed): recommend again for the new set.
      this.durationCtrl.reset(null, { emitEvent: false });
      this.resetPreload();
    }

    if (this.visible && changes['visible'] && this.initialSimulation) {
      this.simulation.set(this.initialSimulation);
      this.durationCtrl.updateValueAndValidity({ emitEvent: false });
      this.afterSimulation();
    } else if (this.visible && (changes['visible'] || changes['records'])) {
      this.requestSimulation();
    }
  }

  private resetPreload(): void {
    this.preloadDone = false;
    this.preloaded = false;
    this.preloadMessage.set(null);
  }

  // Runs after every backend answer. First answer of an opening: preload the
  // recommended minutes (ceil of the backend minimum, i.e. the time that
  // reaches the cap) if they fit the backend limits. The preloaded value is
  // then validated by the regular simulation with that duration; if the
  // backend rejects it, the field goes back to empty with the reason.
  private afterSimulation(): void {
    const sim = this.simulation();
    if (this.preloaded) {
      this.preloaded = false;
      if (this.durationCtrl.invalid && !this.durationCtrl.errors?.['calculating']) {
        this.durationCtrl.reset(null, { emitEvent: false });
        this.preloadMessage.set('No hay un tiempo recomendado válido. Ingresa el tiempo manualmente.');
      }
      return;
    }
    if (this.preloadDone || !sim || this.simulationError() || this.durationCtrl.dirty || this.durationMinutes !== null) return;
    this.preloadDone = true;

    const recommended = this.minMinutes;
    if (recommended === null || this.limitsConflict || (this.maxMinutes !== null && recommended > this.maxMinutes)) {
      this.preloadMessage.set(
        this.limitsConflict
          ? 'El tiempo mínimo supera el tiempo disponible del turno. Reduce las cantidades para poder continuar.'
          : 'No hay un tiempo recomendado disponible. Ingresa el tiempo manualmente.',
      );
      return;
    }
    this.preloaded = true;
    this.durationCtrl.setValue(recommended); // valueChanges -> simulation with this duration
  }

  protected requestSimulation(): void {
    this.loading.set(true);
    this.simulate$.next();
  }

  private minutesOf(control: AbstractControl): number | null {
    const value = Number(control.value);
    return control.value !== null && control.value !== '' && Number.isFinite(value) && value > 0 ? value : null;
  }

  // Whole minutes typed by the user; null when empty or not a positive number.
  protected get durationMinutes(): number | null {
    return this.minutesOf(this.durationCtrl);
  }

  // Derived read-only start time; null when there is no duration or it does not fit in the day.
  protected get startTime(): string | null {
    return this.durationMinutes === null ? null : timeMinusMinutes(this.endTime(), this.durationMinutes);
  }

  protected get totalUnits(): number {
    return this.records.reduce(
      (sum, r) => sum + Number(r.completed_quantity ?? 0) + Number(r.rejected_quantity ?? 0) + Number(r.scrap_quantity ?? 0),
      0,
    );
  }

  protected additionalTimesMinutes(record: PendingReviewRecord): number {
    const total = (record.additional_times ?? []).reduce(
      (sum, item) => sum + (this.additionalTimeMinutes[item.id] ?? 0) * item.count,
      0,
    );
    return Math.round(total * 100) / 100;
  }

  protected get minMinutes(): number | null {
    const min = this.simulation()?.min_duration_seconds;
    return min == null ? null : Math.ceil(min / 60);
  }

  protected get maxMinutes(): number | null {
    const max = this.simulation()?.max_duration_seconds;
    return max == null ? null : Math.floor(max / 60);
  }

  // No duration can satisfy both limits (available shift time < minimum for the efficiency cap).
  protected get limitsConflict(): boolean {
    return this.minMinutes !== null && this.maxMinutes !== null && this.minMinutes > this.maxMinutes;
  }

  // Errors are shown once the field was touched/edited, or after a confirm attempt.
  protected get showErrors(): boolean {
    return this.durationCtrl.invalid && (this.durationCtrl.touched || this.durationCtrl.dirty);
  }

  // Specific message per validator error (the loading/failed states have their own panel).
  protected get fieldErrors(): string[] {
    const errors = this.durationCtrl.errors;
    if (!errors) return [];
    const messages: string[] = [];
    if (errors['required']) messages.push('Ingresa el tiempo total empleado.');
    if (errors['notNumber']) messages.push('El tiempo debe ser un número.');
    if (errors['notPositive']) messages.push('El tiempo debe ser mayor que cero.');
    if (errors['belowMin']) messages.push(`El tiempo mínimo permitido es ${errors['belowMin'].min} min.`);
    if (errors['aboveMax']) messages.push(`El tiempo máximo permitido es ${errors['aboveMax'].max} min.`);
    if (errors['efficiencyExceeded']) {
      const e = errors['efficiencyExceeded'];
      messages.push(`Con este tiempo la eficiencia sería ${e.efficiency.toFixed(2)} %, superior al ${e.max.toFixed(2)} % permitido.`);
    }
    if (errors['startOutOfDay']) messages.push('La duración no cabe en el día: la hora inicial quedaría antes de las 00:00.');
    return messages;
  }

  // State of the estimated-efficiency indicator (value comes from the backend simulation).
  protected get efficiencyState(): 'loading' | 'error' | 'empty' | 'over' | 'ok' {
    if (this.loading()) return 'loading';
    const sim = this.simulation();
    if (this.simulationError() || !sim) return 'error';
    if (this.durationMinutes === null) return 'empty';
    if (sim.efficiency === null) return 'error';
    return sim.efficiency > sim.max_efficiency ? 'over' : 'ok';
  }

  protected get confirmDisabled(): boolean {
    return !this.enable || this.saving || this.loading() || !this.records.length
      || this.form.invalid || this.form.pending || !!this.simulationError();
  }

  protected confirm(): void {
    this.form.markAllAsTouched();
    if (this.confirmDisabled) return;
    this.onConfirm.emit({
      start_time: this.startTime!,
      end_time: this.endTime(),
      duration_seconds: this.durationMinutes! * 60,
    });
  }
}
