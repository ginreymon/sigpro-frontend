import { Component, computed, contentChild, contentChildren, input, output, signal } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { UiButton } from '../ui-button/ui-button';
import { UiIcon } from '../ui-icon/ui-icon';
import { StepperItem, UiStepper } from '../ui-stepper/ui-stepper';
import { UiStep, UiSummary, UiSummaryContext } from './ui-step.directive';

export interface MultiStepConfig extends StepperItem {
  /** Whether the step is valid and the user may advance. Defaults to true. */
  valid?: boolean;
}

@Component({
  selector: 'app-ui-multi-step-form',
  imports: [NgTemplateOutlet, UiButton, UiIcon, UiStepper],
  templateUrl: './ui-multi-step-form.html',
})
export class UiMultiStepForm {
  readonly steps = input.required<MultiStepConfig[]>();
  readonly summaryLabel = input('Resumen');
  readonly submitLabel = input('Confirmar');
  /** Parent sets this while the request runs; locks the confirm button. */
  readonly submitting = input(false);
  /** Extra lock for the confirm button (e.g. outside the allowed time window). */
  readonly confirmDisabled = input(false);
  /** When false there is no summary step and the last step shows no forward button. */
  readonly hasSummary = input(true);

  readonly stepChange = output<number>();
  readonly submitted = output<void>();

  readonly stepTemplates = contentChildren(UiStep);
  readonly summaryTemplate = contentChild(UiSummary);

  readonly index = signal(0);

  /** Configured steps plus the final summary step. */
  readonly allSteps = computed<StepperItem[]>(() => [
    ...this.steps(),
    ...(this.hasSummary() ? [{ key: '__summary', label: this.summaryLabel() }] : []),
  ]);
  readonly isSummary = computed(() => this.hasSummary() && this.index() === this.steps().length);
  readonly isLast = computed(() => this.index() === this.allSteps().length - 1);
  readonly isFirst = computed(() => this.index() === 0);
  readonly canAdvance = computed(() => this.isSummary() || this.steps()[this.index()]?.valid !== false);
  /** The first invalid step blocks every step after it. */
  readonly maxReachable = computed(() => {
    const firstInvalid = this.steps().findIndex((s) => s.valid === false);
    return firstInvalid === -1 ? this.allSteps().length - 1 : firstInvalid;
  });

  readonly summaryContext: UiSummaryContext = {
    goTo: (key) => {
      const i = this.steps().findIndex((s) => s.key === key);
      if (i !== -1) this.goTo(i);
    },
  };

  templateFor(key: string) {
    return this.stepTemplates().find((s) => s.key() === key)?.template ?? null;
  }

  goTo(i: number) {
    if (i < 0 || i > this.maxReachable() || i === this.index()) return;
    this.index.set(i);
    this.stepChange.emit(i);
  }

  next() {
    if (this.canAdvance()) this.goTo(this.index() + 1);
  }

  prev() {
    this.goTo(this.index() - 1);
  }

  confirm() {
    if (!this.hasSummary() || this.submitting() || this.confirmDisabled()) return;
    if (this.maxReachable() < this.steps().length) return;
    this.submitted.emit();
  }
}
