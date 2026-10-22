import { Component, computed, input } from '@angular/core';
import { DecimalPipe, NgComponentOutlet } from '@angular/common';
import { WorkCenterDocument } from '../../../../../../models/integration/order-by-work-center';
import { DocumentSection } from '../document-section/document-section';
import { DocumentStat } from '../document-stat/document-stat';
import { DocumentDetailMode, ORIGIN_DETAIL_COMPONENTS } from '../document-origin-detail';

// Body of an OP accordion item: common sections (SIGPRO, SIESA, Registros) plus
// the area-specific detail resolved from `originId`.
@Component({
  selector: 'app-document-detail',
  imports: [NgComponentOutlet, DecimalPipe, DocumentSection, DocumentStat],
  host: { class: 'flex flex-col gap-2 pb-1' },
  templateUrl: './document-detail.html',
})
export class DocumentDetail {
  readonly document = input.required<WorkCenterDocument>();
  readonly originId = input<number | null | undefined>(null);
  readonly mode = input<DocumentDetailMode>('view');
  readonly sourceName = input('SIESA');
  readonly targetName = input('SIGPRO');

  protected readonly originDetail = computed(() => {
    const id = this.originId();
    return id == null ? null : (ORIGIN_DETAIL_COMPONENTS[this.mode()][id] ?? null);
  });

  protected readonly detailInputs = computed(() => ({ ...this.originDetail()?.inputs, document: this.document() }));

  // In `integrate` the area component replaces the common sections.
  protected readonly showCommonSections = computed(
    () => this.mode() === 'view' || this.originDetail() === null,
  );
}
