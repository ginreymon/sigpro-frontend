import { Component, inject, LOCALE_ID, signal } from '@angular/core';
import { DatePipe, formatDate, NgTemplateOutlet } from '@angular/common';
import { WorkSpaceLayout } from '../../../../layouts/work-space-layout/work-space-layout';
import { DataTable } from '../../../components/table/data-table/data-table';
import { SideModalLayout } from '../../../components/layout/side-modal-layout/side-modal-layout';
import { ModalLayout } from '../../../components/layout/modal-layout/modal-layout';
import { BaseCrudPage } from '../../../../common/classes/base-crud-page';
import { TableColumn } from '../../../../common/interfaces/table-column';
import { TableActions } from '../../../../common/interfaces/table-actions';
import { TableToolsButtons } from '../../../../common/interfaces/table-tools-buttons';
import { toLocalDate } from '../../../../common/functions/time-range';

import { UiAccordionItem } from '../../../elements/ui-accordion-item/ui-accordion-item';
import { UiBadge } from '../../../elements/ui-badge/ui-badge';
import { DocumentIntegrationMatrix } from './options/production/document-integration-matrix/document-integration-matrix';
import { DocumentIntegrationStamping } from './options/stamping/document-integration-stamping/document-integration-stamping';
import { SelectionSummary } from './components/integration-time-inputs/integration-time-inputs';
import { DocumentDetail } from './components/document-detail/document-detail';
import { UiLabelButton } from '../../../elements/ui-label-button/ui-label-button';
import { UiOriginBadge } from '../../../elements/ui-origin-badge/ui-origin-badge';
import { CharSquare } from '../../../components/widgets/char-square/char-square';
import { TableTemplate } from '../../../../directives/table-template';
import { OrderByWorkCenter } from '../../../../models/integration/order-by-work-center';
import { PaginatedResponse } from '../../../../common/interfaces/paginated-response';
import { OrdersByWorkCenterService } from '../../../../services/integration/orders-by-work-center-service';
import { UiIcon } from '../../../elements/ui-icon/ui-icon';

// Read-only view of orders-to-be-outbound/by-work-center: totals per work center
// with their documents (OPs), no day split.
// Same reference for every OP without selection, so the bound input does not change on each check.
const NO_SELECTION: number[] = [];

@Component({
  selector: 'app-work-center-totals',
  imports: [
    WorkSpaceLayout,
    DataTable,
    SideModalLayout,
    ModalLayout,
    DatePipe,
    TableTemplate,
    NgTemplateOutlet,
    UiAccordionItem,
    UiBadge,
    DocumentDetail,
    DocumentIntegrationMatrix,
    DocumentIntegrationStamping,
    UiLabelButton,
    UiOriginBadge,
    CharSquare,
    UiIcon,
  ],
  templateUrl: './work-center-totals.html',
})
export class WorkCenterTotals extends BaseCrudPage<OrderByWorkCenter> {
  protected override entityName: string = 'Centro de trabajo';
  protected readonly sourceName: string = 'SIESA';
  protected readonly targetName: string = 'SIGPRO';

  // first_start/last_end arrive in UTC without a zone suffix: toLocalDate marks
  // them as UTC so DatePipe shows local time.
  protected readonly toLocalDate = toLocalDate;

  protected override get actions(): TableActions {
    return {
      view: { enabled: true, title: 'Detalle Centro de Trabajo', iconName: 'eye', toolTip: 'Ver' },
      edit: { enabled: false },
      delete: { enabled: false },
      create: { enabled: false },
    };
  }

  protected override tableToolsButtons: TableToolsButtons = {
    filter: { enabled: false },
    columns: { enabled: false },
    export: { enabled: false },
    addItem: { enabled: false },
  };

  constructor(ordersByWorkCenterService: OrdersByWorkCenterService) {
    super(ordersByWorkCenterService);
  }

  private readonly locale = inject(LOCALE_ID);

  protected override mapResponse(res: PaginatedResponse<OrderByWorkCenter>): PaginatedResponse<OrderByWorkCenter> {
    return {
      ...res,
      results: res.results.map((row) => {
        const lastEnd = toLocalDate(row.last_end);
        return { ...row, end_date: lastEnd ? formatDate(lastEnd, 'dd/MM/yyyy', this.locale) : undefined };
      }),
    };
  }

  // The central modal (ModalLayout) shows what will be integrated for the work center.
  protected integrate(row: OrderByWorkCenter): void {
    this.rowObject = row;
    this.dialogService.openModal('Integrar OPs', 'Aceptar');
  }

  protected expandedDocumentIndexes = signal<Set<number>>(new Set());

  // SKUs picked in the integration matrix of each OP (by op_rowid), kept here so they survive collapsing the accordion.
  protected readonly selectedSkuIdsByOp = signal<Record<number, number[]>>({});

  protected selectedSkuIdsOf(opRowid: number): number[] {
    return this.selectedSkuIdsByOp()[opRowid] ?? NO_SELECTION;
  }

  protected setSelectedSkuIds(opRowid: number, ids: number[]): void {
    this.selectedSkuIdsByOp.update((byOp) => ({ ...byOp, [opRowid]: ids }));
  }

  // Units and time of the selection of each OP (by op_rowid), reported by its matrix.
  private readonly selectionSummaryByOp = signal<Record<number, SelectionSummary>>({});

  protected setSelectionSummary(opRowid: number, summary: SelectionSummary): void {
    this.selectionSummaryByOp.update((byOp) => ({ ...byOp, [opRowid]: summary }));
  }

  // One row per OP of the work center with units selected, for the table at the top of the integrate modal.
  protected selectionRows(): { op: string; reference: string; units: number; minutes: number }[] {
    const byOp = this.selectionSummaryByOp();
    return (this.rowObject.documents ?? [])
      .filter((doc) => (byOp[doc.op_rowid]?.units ?? 0) > 0)
      .map((doc) => {
        const { units, hours, minutes } = byOp[doc.op_rowid];
        return {
          op: `${doc.op_type} ${doc.op_number}`,
          reference: doc.reference || '—',
          units,
          minutes: hours * 60 + minutes,
        };
      });
  }

  protected selectionTotals(rows: { units: number; minutes: number }[]): { units: number; minutes: number } {
    return {
      units: rows.reduce((sum, row) => sum + row.units, 0),
      minutes: rows.reduce((sum, row) => sum + row.minutes, 0),
    };
  }

  protected formatTime(totalMinutes: number): string {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(Math.floor(totalMinutes / 60))}:${pad(totalMinutes % 60)}`;
  }

  protected override closeModelForm(): void {
    this.expandedDocumentIndexes.set(new Set());
    this.selectionSummaryByOp.set({});
    this.selectedSkuIdsByOp.set({});
    super.closeModelForm();
  }

  protected toggleDocumentExpanded(index: number): void {
    const expanded = new Set(this.expandedDocumentIndexes());
    if (!expanded.delete(index)) {
      expanded.add(index);
    }
    this.expandedDocumentIndexes.set(expanded);
  }

  protected override get columns(): TableColumn<OrderByWorkCenter>[] {
    return [
      { field: 'end_date', type: 'template', label: 'Fecha', templateName: 'lastEndTemplate' },
      { field: 'origin', type: 'template', label: 'Área', templateName: 'originTemplate' },
      { field: 'code', type: 'template', label: 'Centro de trabajo', templateName: 'workCenterTemplate' },
      { type: 'template', label: 'Órdenes', templateName: 'documentsTemplate', align: 'center' },
      { type: 'template', label: 'Acciones', templateName: 'integrateTemplate', align: 'center' },
    ];
  }
}
