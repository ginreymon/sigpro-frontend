import { Component, input } from '@angular/core';

// Label/value cell of the document detail grids (see DocumentSection).
@Component({
  selector: 'app-document-stat',
  host: { class: 'block' },
  template: `
    <div class="bg-white px-3 py-2 min-w-0">
      <dt class="text-xs text-slate-500 truncate">{{ label() }}</dt>
      <dd class="text-sm font-semibold tabular-nums truncate" [class]="tone() || 'text-gray-700'">{{ value() }}</dd>
    </div>
  `,
})
export class DocumentStat {
  readonly label = input.required<string>();
  readonly value = input.required<string | number | null | undefined>();
  readonly tone = input<string>('');
}
