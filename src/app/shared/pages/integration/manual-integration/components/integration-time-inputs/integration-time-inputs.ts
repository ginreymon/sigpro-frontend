import { Component, computed, DestroyRef, effect, inject, input, output, signal, untracked } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { merge } from 'rxjs';
import { calculateTepTime } from '../../../../../../common/functions/tep-time';
import { UiFormField } from '../../../../../elements/ui-form-field/ui-form-field';
import { UiHourInput } from '../../../../../elements/ui-hour-input/ui-hour-input';
import { UiInput } from '../../../../../elements/ui-input/ui-input';
import { UiSelect } from '../../../../../elements/ui-select/ui-select';
import { TEP_SUBPROCESS_OPTIONS, TepSubprocess } from '../../../../../../models/integration/tep-send';

// Units, time (as shown in the inputs) and subprocess of what was picked in one OP.
// `subprocess` stays null until picked, and always when the origin does not ask for it.
// `valid` is false while a required field is missing or wrong.
export interface SelectionSummary {
  units: number;
  hours: number;
  minutes: number;
  subprocess: TepSubprocess | null;
  // Time type the inputs were calculated with ("Real" when true, "Estándar" when false).
  useRecordedTime: boolean;
  valid: boolean;
}

// Only digits with an optional decimal part (the number input also lets "e" and signs through).
const POSITIVE_NUMBER = /^\d*\.?\d+$/;

// Hours/minutes inputs of the integrate modal, shared by every origin (Confección matrix,
// Estampación). They are preloaded with units x seconds per unit every time the selection
// changes, stay editable in between, and report units + time through `summary`.
@Component({
  selector: 'app-integration-time-inputs',
  imports: [ReactiveFormsModule, UiFormField, UiHourInput, UiSelect, UiInput],
  templateUrl: './integration-time-inputs.html',
})
export class IntegrationTimeInputs {
  private static nextId = 0;
  // Unique per instance: several OPs can be expanded at once.
  protected readonly uid = IntegrationTimeInputs.nextId++;

  // Units picked (completed units of the selection).
  readonly units = input.required<number>();
  // seconds_by_unit + additional_seconds_by_unit of the OP.
  readonly secondsPerUnit = input.required<number>();
  // Any value that changes when the selection changes: reloads the calculated time even if it is the same.
  readonly selection = input<unknown>();
  // The inputs are only drawn when there is something selected; the summary is emitted either way.
  readonly visible = input(false);
  // Confección only: asks for the mandatory subprocess (no default, the user has to pick one).
  readonly askSubprocess = input(false);
  // The parent tried to integrate: show the errors of every field, touched or not.
  readonly submitted = input(false);
  // TEP_TIME_CALCULATION_MODE: false = base quantity (default), true = recorded time of the operation.
  readonly useRecordedTime = input(false);
  // base_route_quantity of the OP; only used by the recorded time mode.
  readonly baseRouteQuantity = input<number | null>(null);
  readonly summary = output<SelectionSummary>();

  protected readonly subprocessOptions = TEP_SUBPROCESS_OPTIONS;

  protected readonly form = new FormGroup({
    subprocess: new FormControl<TepSubprocess | null>(null, Validators.required),
    // Extra seconds for the whole selection typed by the user; only asked when a subprocess other than "none" is picked.
    additionalSeconds: new FormControl<number | null>(null, [
      Validators.required,
      Validators.pattern(POSITIVE_NUMBER),
      Validators.min(0.01),
    ]),
    hours: new FormControl<number | null>(0, [Validators.required, Validators.min(0), Validators.max(99)]),
    minutes: new FormControl<number | null>(0, [Validators.required, Validators.min(0), Validators.max(59)]),
  });

  private readonly subprocess = signal<TepSubprocess | null>(null);
  private readonly additionalSeconds = signal(0);
  // The subprocess (and its extra time) only applies in the recorded time mode; in the base quantity mode
  // the OP goes without subprocess and only the units and the time are asked.
  protected readonly showSubprocess = computed(() => this.askSubprocess() && this.useRecordedTime());
  protected readonly needsAdditionalTime = computed(
    () => this.showSubprocess() && !!this.subprocess() && this.subprocess() !== 'none',
  );

  // Preloaded time: calculated by calculateTepTime according to `useRecordedTime`.
  private readonly defaultTime = computed(() =>
    calculateTepTime(this.useRecordedTime(), {
      units: this.units(),
      secondsPerUnit: this.secondsPerUnit(),
      extraSeconds: this.needsAdditionalTime() ? this.additionalSeconds() : 0,
      baseRouteQuantity: this.baseRouteQuantity(),
    }),
  );

  constructor() {
    const destroyRef = inject(DestroyRef);
    const { subprocess, additionalSeconds, hours, minutes } = this.form.controls;

    effect(() => {
      this.selection();
      const time = this.defaultTime();
      const units = this.units();
      untracked(() => {
        hours.setValue(time.hours, { emitEvent: false });
        minutes.setValue(time.minutes, { emitEvent: false });
        this.emitSummary(units);
      });
    });

    // A disabled control does not count for the validity: only ask for what applies.
    effect(() => {
      const show = this.showSubprocess();
      const defaultsToNone = this.askSubprocess() && !show;
      const needsAdditional = this.needsAdditionalTime();
      untracked(() => {
        if (defaultsToNone) {
          subprocess.setValue('none', { emitEvent: false });
          this.subprocess.set('none');
        }
        this.toggle(subprocess, show);
        this.toggle(additionalSeconds, needsAdditional);
        this.emitSummary(this.units());
      });
    });

    effect(() => {
      if (this.submitted()) this.form.markAllAsTouched();
    });

    subprocess.valueChanges.pipe(takeUntilDestroyed(destroyRef)).subscribe((value) => {
      this.subprocess.set(value);
      if (value === 'none') {
        additionalSeconds.reset(null, { emitEvent: false });
        this.additionalSeconds.set(0);
      }
    });
    additionalSeconds.valueChanges
      .pipe(takeUntilDestroyed(destroyRef))
      .subscribe((value) => this.additionalSeconds.set(Number(value) || 0));

    // Manual edits also reach the parent.
    merge(hours.valueChanges, minutes.valueChanges, subprocess.valueChanges, additionalSeconds.valueChanges)
      .pipe(takeUntilDestroyed(destroyRef))
      .subscribe(() => this.emitSummary(this.units()));
  }

  private toggle(control: FormControl, enabled: boolean): void {
    if (enabled) control.enable({ emitEvent: false });
    else control.disable({ emitEvent: false });
  }

  private emitSummary(units: number): void {
    const { subprocess, hours, minutes } = this.form.getRawValue();
    this.summary.emit({
      units,
      hours: hours ?? 0,
      minutes: minutes ?? 0,
      subprocess: this.askSubprocess() ? (this.showSubprocess() ? subprocess : 'none') : null,
      useRecordedTime: this.useRecordedTime(),
      valid: this.form.valid,
    });
  }
}
