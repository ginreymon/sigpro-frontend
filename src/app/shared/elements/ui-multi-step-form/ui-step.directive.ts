import { Directive, inject, input, TemplateRef } from '@angular/core';

/** Marks an `<ng-template>` as the content of the step with the given key. */
@Directive({ selector: 'ng-template[uiStep]' })
export class UiStep {
  readonly key = input.required<string>({ alias: 'uiStep' });
  readonly template = inject(TemplateRef);
}

export interface UiSummaryContext {
  /** Jump back to a step (by key) to edit its data. */
  goTo: (key: string) => void;
}

/** Marks an `<ng-template>` as the final summary content. Context: `{ goTo }`. */
@Directive({ selector: 'ng-template[uiSummary]' })
export class UiSummary {
  readonly template = inject<TemplateRef<UiSummaryContext>>(TemplateRef);

  static ngTemplateContextGuard(_dir: UiSummary, _ctx: unknown): _ctx is UiSummaryContext {
    return true;
  }
}
