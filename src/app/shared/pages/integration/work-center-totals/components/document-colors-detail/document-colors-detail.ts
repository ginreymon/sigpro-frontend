import { Component, input } from '@angular/core';
import { WorkCenterDocument } from '../../../../../../models/integration/order-by-work-center';
import { DocumentSection } from '../document-section/document-section';
import { DocumentStat } from '../document-stat/document-stat';

// Confección view detail (origin_id = 1): completed / ordered quantity per color.
@Component({
  selector: 'app-document-colors-detail',
  imports: [DocumentSection, DocumentStat],
  templateUrl: './document-colors-detail.html',
})
export class DocumentColorsDetail {
  readonly document = input.required<WorkCenterDocument>();
}
