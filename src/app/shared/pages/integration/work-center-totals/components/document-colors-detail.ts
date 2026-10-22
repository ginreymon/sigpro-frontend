import { Component, input } from '@angular/core';
import { WorkCenterDocument } from '../../../../../models/integration/order-by-work-center';
import { DocumentSection } from './document-section';
import { DocumentStat } from './document-stat';

// Confección detail (origin_id = 1): completed / ordered quantity per color.
@Component({
  selector: 'app-document-colors-detail',
  imports: [DocumentSection, DocumentStat],
  template: `
    @if (detail()?.colorRows?.length) {
      <app-document-section title="Colores">
        @for (color of detail()!.colorRows; track color.color) {
          <app-document-stat [label]="color.color"
            [value]="color.totals.completedQty + ' / ' + color.totals.orderedQty"></app-document-stat>
        }
      </app-document-section>
    }
  `,
})
export class DocumentColorsDetail {
  readonly detail = input<WorkCenterDocument['detail']>(null);
}
