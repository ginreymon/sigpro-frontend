import { Component, inject, LOCALE_ID, signal } from '@angular/core';
import { formatDate, NgTemplateOutlet } from '@angular/common';
import { WorkSpaceLayout } from '../../../../layouts/work-space-layout/work-space-layout';
import { DataTable } from '../../../components/table/data-table/data-table';
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
import { UiLabelButton } from '../../../elements/ui-label-button/ui-label-button';
import { UiOriginBadge } from '../../../elements/ui-origin-badge/ui-origin-badge';
import { TableTemplate } from '../../../../directives/table-template';
import { OrderByWorkCenter } from '../../../../models/integration/order-by-work-center';
import { PaginatedResponse } from '../../../../common/interfaces/paginated-response';
import { OrdersByWorkCenterService } from '../../../../services/integration/orders-by-work-center-service';
import { UiIcon } from '../../../elements/ui-icon/ui-icon';
import { TepSendDetail, TepSendRequest } from '../../../../models/integration/tep-send';
import { buildTepDetail, buildTepRequest, PickedOp } from './tep-payload';

// Read-only view of orders-to-be-outbound/by-work-center: totals per work center
// with their documents (OPs), no day split.
// Same reference for every OP without selection, so the bound input does not change on each check.
const NO_SELECTION: number[] = [];

@Component({
  selector: 'app-manual-integration',
  imports: [
    WorkSpaceLayout,
    DataTable,
    ModalLayout,
    TableTemplate,
    NgTemplateOutlet,
    UiAccordionItem,
    UiBadge,
    DocumentIntegrationMatrix,
    DocumentIntegrationStamping,
    UiLabelButton,
    UiOriginBadge,
    UiIcon,
  ],
  templateUrl: './manual-integration.html',
})
export class ManualIntegration extends BaseCrudPage<OrderByWorkCenter> {
  protected override entityName: string = 'Centro de trabajo';

  protected override get actions(): TableActions {
    return {
      view: { enabled: false },
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
    this.dialogService.openModal('Integrar OPs', 'Integrar');
  }

  // "Integrar" button of the central modal: asks for confirmation first. The integration itself is not
  // implemented yet, so confirming only closes the dialogs and clears the selection.
  protected confirmIntegration(): void {
    // Every picked OP must have its required fields filled (subprocess, its extra time and the time).
    if (this.pickedOps().some((picked) => !picked.summary.valid)) {
      this.submitted.set(true);
      this.dialogService.openToast('Datos incompletos', 'Complete los campos requeridos de cada OP a integrar.', 'fail');
      return;
    }
    this.dialogService.openConfirm(
      'Integrar',
      'Al realizar esta acción ya no se podrá revertir. ¿Desea continuar con la integración?',
      'Integrar',
      () => {
        this.dialogService.closeConfirm();
        this.closeModelForm();
      },
    );
  }

  protected expandedDocumentIndexes = signal<Set<number>>(new Set());

  // Set when integrating with missing data, so the time inputs of every OP show their errors.
  protected readonly submitted = signal(false);

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

  // OPs of the work center with units selected, with what the user picked and the units/time of it.
  private pickedOps(): PickedOp[] {
    const byOp = this.selectionSummaryByOp();
    return (this.rowObject.documents ?? [])
      .filter((doc) => (byOp[doc.op_rowid]?.units ?? 0) > 0)
      .map((doc) => ({ document: doc, selectedIds: this.selectedSkuIdsOf(doc.op_rowid), summary: byOp[doc.op_rowid] }));
  }

  // One row per picked OP, for the table at the top of the integrate modal. `tep` is the item of the
  // `details` of the TEP payload for that row, already built.
  protected selectionRows(): { op: string; reference: string; units: number; minutes: number; tep: TepSendDetail }[] {
    return this.pickedOps().map((picked) => ({
      op: `${picked.document.op_type} ${picked.document.op_number}`,
      reference: picked.document.reference || '—',
      units: picked.summary.units,
      minutes: picked.summary.hours * 60 + picked.summary.minutes,
      tep: buildTepDetail(this.rowObject as OrderByWorkCenter, picked),
    }));
  }

  // Body of POST integration/tep/send/ for what is shown in the table (the send itself is not wired yet).
  protected tepRequest(): TepSendRequest {
    return buildTepRequest(this.rowObject as OrderByWorkCenter, this.pickedOps());
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
    this.submitted.set(false);
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
