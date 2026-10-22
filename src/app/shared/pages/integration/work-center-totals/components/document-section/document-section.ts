import { Component, input } from '@angular/core';

// Titled block of the document detail: header + 2-column grid of DocumentStat (projected).
@Component({
  selector: 'app-document-section',
  host: { class: 'block' },
  templateUrl: './document-section.html',
})
export class DocumentSection {
  readonly title = input.required<string>();
  readonly dotClass = input<string>('bg-slate-300');
}
