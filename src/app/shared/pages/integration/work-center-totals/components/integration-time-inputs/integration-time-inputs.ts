import { DecimalPipe } from '@angular/common';
import { Component, computed, DestroyRef, effect, inject, input, output, untracked } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { merge } from 'rxjs';
import { UiHourInput } from '../../../../../elements/ui-hour-input/ui-hour-input';

// Units and time (as shown in the inputs) of what was picked in one OP.
export interface SelectionSummary {
  units: number;
  hours: number;
  minutes: number;
}

// Hours/minutes inputs of the integrate modal, shared by every origin (Confección matrix,
// Estampación). They are preloaded with units x seconds per unit every time the selection
// changes, stay editable in between, and report units + time through `summary`.
@Component({
  selector: 'app-integration-time-inputs',
  imports: [DecimalPipe, ReactiveFormsModule, UiHourInput],
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
  readonly summary = output<SelectionSummary>();

  // Units x seconds per unit, as hours and minutes (rounded to the minute).
  private readonly defaultTime = computed(() => {
    const totalMinutes = Math.round((this.units() * this.secondsPerUnit()) / 60);
    return { hours: Math.floor(totalMinutes / 60), minutes: totalMinutes % 60 };
  });

  protected readonly hoursControl = new FormControl<number | null>(0);
  protected readonly minutesControl = new FormControl<number | null>(0);

  constructor() {
    effect(() => {
      this.selection();
      const { hours, minutes } = this.defaultTime();
      const units = this.units();
      untracked(() => {
        this.hoursControl.setValue(hours, { emitEvent: false });
        this.minutesControl.setValue(minutes, { emitEvent: false });
        this.emitSummary(units);
      });
    });

    // Manual edits of the time also reach the parent.
    merge(this.hoursControl.valueChanges, this.minutesControl.valueChanges)
      .pipe(takeUntilDestroyed(inject(DestroyRef)))
      .subscribe(() => this.emitSummary(this.units()));
  }

  private emitSummary(units: number): void {
    this.summary.emit({
      units,
      hours: this.hoursControl.value ?? 0,
      minutes: this.minutesControl.value ?? 0,
    });
  }
}
