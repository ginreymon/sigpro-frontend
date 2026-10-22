import { Component, input } from '@angular/core';

// Titled block of the document detail: header + 2-column grid of DocumentStat (projected).
@Component({
  selector: 'app-document-section',
  host: { class: 'block' },
  template: `
    <section class="rounded-md border border-slate-200 overflow-hidden">
      <header class="flex items-center gap-2 px-3 py-1.5 bg-slate-100 border-b border-slate-200">
        <span class="h-1.5 w-1.5 rounded-full shrink-0" [class]="dotClass()"></span>
        <h4 class="text-xs font-semibold uppercase tracking-wide text-slate-600 truncate">{{ title() }}</h4>
      </header>
      <dl class="grid grid-cols-2 gap-px bg-slate-200">
        <ng-content></ng-content>
      </dl>
    </section>
  `,
})
export class DocumentSection {
  readonly title = input.required<string>();
  readonly dotClass = input<string>('bg-slate-300');
}
