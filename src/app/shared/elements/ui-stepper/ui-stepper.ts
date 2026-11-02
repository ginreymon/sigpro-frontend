import { Component, computed, input, output } from '@angular/core';
import { UiIcon } from '../ui-icon/ui-icon';

export interface StepperItem {
  key: string;
  label: string;
  description?: string;
}

@Component({
  selector: 'app-ui-stepper',
  imports: [UiIcon],
  templateUrl: './ui-stepper.html',
})
export class UiStepper {
  readonly steps = input.required<StepperItem[]>();
  /** Zero-based index of the current step. */
  readonly current = input(0);
  /** Highest step index the user may jump to (later steps are not clickable). */
  readonly maxReachable = input(Number.MAX_SAFE_INTEGER);
  readonly stepClick = output<number>();

  readonly currentStep = computed(() => this.steps()[this.current()]);
  readonly progress = computed(() => ((this.current() + 1) / this.steps().length) * 100);

  status(index: number): 'completed' | 'current' | 'pending' {
    if (index === this.current()) return 'current';
    return index < this.current() ? 'completed' : 'pending';
  }

  select(index: number) {
    if (index === this.current() || index > this.maxReachable()) return;
    this.stepClick.emit(index);
  }
}
