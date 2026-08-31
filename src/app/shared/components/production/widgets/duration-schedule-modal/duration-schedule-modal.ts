import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { BoxLayout } from '../../../layout/box-layout/box-layout';
import { UiButton } from '../../../../elements/ui-button/ui-button';
import { UiHourInput } from '../../../../elements/ui-hour-input/ui-hour-input';
import { UiErrorMessage } from '../../../../elements/ui-error-message/ui-error-message';
import { TimeRangeFields } from '../../../form-controls/time-range-fields/time-range-fields';
import { durationMinutesBetween, timeMinusMinutes } from '../../../../../common/functions/time-range';

// Modal de horario para el guardado por lote de app-pending-records-bar:
// captura inicio/fin/duración de todos los registros manuales acumulados en
// ManualProductionRecordsStore antes de "guardarlos". Sin edición (siempre
// son registros nuevos) ni referencia a un SKU concreto (el lote puede
// mezclar varios).
@Component({
  selector: 'app-duration-schedule-modal',
  standalone: true,
  imports: [BoxLayout, UiButton, UiHourInput, TimeRangeFields, ReactiveFormsModule, UiErrorMessage],
  templateUrl: './duration-schedule-modal.html',
})
export class DurationScheduleModal implements OnChanges {
  @Input() visible = false;
  @Input() enable = true;

  // Hora de inicio del turno activo ("HH:mm:ss" o "HH:mm") — la hora
  // inicial del registro manual no puede ser anterior a esto.
  @Input() shiftStartTime: string | null = null;

  @Output() onNext = new EventEmitter<{ start_time: string; end_time: string; duration_seconds: number }>();
  @Output() onCancel = new EventEmitter<void>();

  private fb = inject(FormBuilder);

  recordForm: FormGroup = this.fb.group({
    start_time: [null, Validators.required],
    end_time: [null, Validators.required],
    duration_minutes: [null],
  });

  constructor() {
    // Doble binding entre start_time y duration_minutes (end_time es fijo,
    // "ahora"): editar cualquiera de los dos recalcula el otro. `syncing`
    // evita el rebote infinito.
    let syncing = false;

    this.recordForm.get('start_time')!.valueChanges.subscribe(start => {
      if (syncing || !start) return;
      const end = this.recordForm.get('end_time')?.value;
      const minutes = durationMinutesBetween(start, end);
      syncing = true;
      this.recordForm.get('duration_minutes')!.setValue(minutes, { emitEvent: false });
      syncing = false;
    });

    this.recordForm.get('duration_minutes')!.valueChanges.subscribe(minutes => {
      if (syncing || minutes === null || minutes === '') return;
      const end = this.recordForm.get('end_time')?.value;
      const start = timeMinusMinutes(end, Number(minutes));
      if (!start) return;
      syncing = true;
      this.recordForm.get('start_time')!.setValue(start, { emitEvent: false });
      syncing = false;
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible'] && !this.visible) {
      this.recordForm.reset({ start_time: null, end_time: null, duration_minutes: null });
    }
  }

  // Hora fin siempre es "ahora" — no se pide, solo se muestra bloqueada
  // (app-time-range-fields [disableEnd]). Se calcula cada vez que el bloque
  // se vuelve a montar (@if(visible) en el template), no en un effect, para
  // no reevaluarla mientras el usuario ajusta la hora de inicio.
  protected get currentTimeHHmm(): string {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  }

  protected get manualDurationMinutes(): number | null {
    return durationMinutesBetween(this.recordForm.get('start_time')?.value, this.recordForm.get('end_time')?.value);
  }

  // fin <= inicio (también la marca app-time-range-fields como horaFinMenor
  // en el propio control end_time, pero se sigue usando aquí para bloquear
  // Siguiente sin depender de que ese control esté touched).
  protected get manualRangeInvalid(): boolean {
    const start = this.recordForm.get('start_time')?.value;
    const end = this.recordForm.get('end_time')?.value;
    return !!start && !!end && this.manualDurationMinutes === null;
  }

  private get normalizedShiftStart(): string | null {
    return this.shiftStartTime ? this.shiftStartTime.slice(0, 5) : null;
  }

  // La hora inicial no puede quedar antes de que arrancara el turno —
  // comparación lexicográfica sobre "HH:mm", válida por ser ancho fijo.
  protected get startBeforeShiftInvalid(): boolean {
    const start = this.recordForm.get('start_time')?.value;
    const shiftStart = this.normalizedShiftStart;
    return !!start && !!shiftStart && start < shiftStart;
  }

  protected get horarioInvalid(): boolean {
    return this.manualRangeInvalid || this.startBeforeShiftInvalid;
  }

  protected get horarioComplete(): boolean {
    return !!this.recordForm.get('start_time')?.value && !!this.recordForm.get('end_time')?.value && !this.horarioInvalid;
  }

  protected get primaryActionDisabled(): boolean {
    return !this.enable || !this.horarioComplete;
  }

  protected next(): void {
    if (this.primaryActionDisabled) return;
    this.onNext.emit({
      start_time: this.recordForm.get('start_time')!.value,
      end_time: this.recordForm.get('end_time')!.value,
      duration_seconds: this.manualDurationMinutes! * 60,
    });
  }
}
