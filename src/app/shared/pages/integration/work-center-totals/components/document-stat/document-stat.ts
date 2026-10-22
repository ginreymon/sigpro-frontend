import { Component, input } from '@angular/core';

// Label/value cell of the document detail grids (see DocumentSection).
@Component({
  selector: 'app-document-stat',
  host: { class: 'block' },
  templateUrl: './document-stat.html',
})
export class DocumentStat {
  readonly label = input.required<string>();
  readonly value = input.required<string | number | null | undefined>();
  readonly tone = input<string>('');
}
