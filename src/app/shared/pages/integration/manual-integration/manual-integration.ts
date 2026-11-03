import { Component, HostListener, inject, LOCALE_ID, signal } from '@angular/core';
import { formatDate, NgTemplateOutlet } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs';
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
import { TepService } from '../../../../services/integration/tep-service';
import { tepErrorMessage } from '../../../../common/functions/tep-error';
import { AppConfigService } from '../../../../services/core/app-config-service';
import { UiIcon } from '../../../elements/ui-icon/ui-icon';
import { UiAlert } from '../../../elements/ui-alert/ui-alert';
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
    UiAlert,
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

  constructor(
    ordersByWorkCenterService: OrdersByWorkCenterService,
    private tepService: TepService,
  ) {
    super(ordersByWorkCenterService);
    // The integrate modal reads TEP_TIME_CALCULATION_MODE synchronously: make sure the settings are loaded
    // even when this page is the first one opened after a reload.
    this.appConfig.load().subscribe();
  }

  private readonly appConfig = inject(AppConfigService);
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

  // "Integrar" button of the central modal: asks for confirmation first, then sends the TEP.
  protected confirmIntegration(): void {
    // The button is disabled in these cases; this only guards against a call that bypasses it.
    if (!this.canIntegrate() || this.sending()) {
      this.submitted.set(true);
      return;
    }
    this.dialogService.openConfirm(
      'Integrar',
      'Al realizar esta acción ya no se podrá revertir. ¿Desea continuar con la integración?',
      'Integrar',
      () => this.sendTep(),
    );
  }

  // A request is in flight: keeps the button disabled so the TEP is not sent twice.
  protected readonly sending = signal(false);

  // One POST to integration/tep/send/ with every picked OP (the same endpoint and body as work-center-totals).
  // The selection is only cleared when the API confirms the send; on an error it is kept to retry.
  private sendTep(): void {
    const request = this.tepRequest();
    this.dialogService.closeConfirm();
    this.sending.set(true);
    this.loaderService.showLoader();
    this.tepService
      .send(request)
      .pipe(
        finalize(() => {
          this.sending.set(false);
          this.reload(() => this.loaderService.hideLoader());
        }),
      )
      .subscribe({
        next: (res) => {
          if (res.ok === false) {
            this.dialogService.openToast('No se pudo enviar', `SIESA rechazó el envío (tipo de error ${res.error_type ?? 's/d'}).`, 'fail');
            return;
          }
          this.closeModelForm();
          this.dialogService.openToast('Proceso exitoso', 'El TEP fue enviado correctamente.', 'check');
        },
        error: (err: HttpErrorResponse) =>
          this.dialogService.openToast('No se pudo enviar', tepErrorMessage(err), 'fail'),
      });
  }

  // Work center whose OPs mini-card is open, with the viewport position of its arrow.
  // The card sits below the arrow, or above it when there is more room there; `maxHeight` keeps it
  // inside the viewport on any screen size.
  protected readonly opsCard = signal<{
    row: OrderByWorkCenter;
    left: number;
    width: number;
    maxHeight: number;
    top?: number;
    bottom?: number;
  } | null>(null);

  protected toggleOpsCard(row: OrderByWorkCenter, event: Event): void {
    event.stopPropagation();
    if (this.opsCard()?.row === row) {
      this.closeOpsCard();
      return;
    }
    const margin = 8;
    const gap = 4;
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const width = Math.min(288, window.innerWidth - margin * 2);
    const left = Math.max(margin, Math.min(rect.left + rect.width / 2 - width / 2, window.innerWidth - width - margin));
    const spaceBelow = window.innerHeight - rect.bottom - gap - margin;
    const spaceAbove = rect.top - gap - margin;
    const below = spaceBelow >= 200 || spaceBelow >= spaceAbove;
    const maxHeight = Math.min(320, below ? spaceBelow : spaceAbove);
    this.opsCard.set(
      below
        ? { row, left, width, maxHeight, top: rect.bottom + gap }
        : { row, left, width, maxHeight, bottom: window.innerHeight - rect.top + gap },
    );
  }

  // Position is computed from the viewport when opening, so it is stale after a resize.
  @HostListener('window:resize')
  @HostListener('document:keydown.escape')
  protected closeOpsCard(): void {
    this.opsCard.set(null);
  }

  protected expandedDocumentIndexes = signal<Set<number>>(new Set());

  // Set when integrating with missing data, so the time inputs of every OP show their errors.
  protected readonly submitted = signal(false);

  // The user closed the alert of the integrate modal; it shows again when the selection changes.
  protected readonly invalidAlertDismissed = signal(false);

  // At least one OP is picked and every picked OP has its required fields filled (subprocess, its extra
  // time and the time). "Integrar" is disabled otherwise.
  protected canIntegrate(): boolean {
    const picked = this.pickedOps();
    return picked.length > 0 && picked.every((op) => op.summary.valid);
  }

  // Picked OPs with missing or wrong data (subprocess, its extra time or the time).
  private invalidOps(): PickedOp[] {
    return this.pickedOps().filter((op) => !op.summary.valid);
  }

  // The time inputs of every OP show their errors (touched) while an OP has invalid data, because the
  // disabled "Integrar" button leaves no click to trigger them.
  protected hasInvalidSelection(): boolean {
    return this.invalidOps().length > 0;
  }

  // Message of the alert in the header of the integrate modal, naming the OPs that have errors.
  protected invalidSelectionMessage(): string | null {
    const invalid = this.invalidOps();
    if (this.invalidAlertDismissed() || !invalid.length) return null;
    const ops = invalid.map((op) => `${op.document.op_type} ${op.document.op_number}`).join(', ');
    return `Complete los campos requeridos (subproceso y tiempos) en: ${ops}.`;
  }

  // SKUs picked in the integration matrix of each OP (by op_rowid), kept here so they survive collapsing the accordion.
  protected readonly selectedSkuIdsByOp = signal<Record<number, number[]>>({});

  protected selectedSkuIdsOf(opRowid: number): number[] {
    return this.selectedSkuIdsByOp()[opRowid] ?? NO_SELECTION;
  }

  protected setSelectedSkuIds(opRowid: number, ids: number[]): void {
    this.invalidAlertDismissed.set(false);
    this.selectedSkuIdsByOp.update((byOp) => ({ ...byOp, [opRowid]: ids }));
  }

  // Exact records picked in the single-quantity mode of each OP (by op_rowid); null = matrix mode.
  private readonly selectedRecordIdsByOp = signal<Record<number, number[] | null>>({});

  // Single quantity is the default view: an OP the user has not switched yet starts with no records picked.
  protected selectedRecordIdsOf(opRowid: number): number[] | null {
    const picked = this.selectedRecordIdsByOp()[opRowid];
    return picked === undefined ? [] : picked;
  }

  protected setSelectedRecordIds(opRowid: number, ids: number[] | null): void {
    this.invalidAlertDismissed.set(false);
    this.selectedRecordIdsByOp.update((byOp) => ({ ...byOp, [opRowid]: ids }));
  }

  // Units and time of the selection of each OP (by op_rowid), reported by its matrix.
  private readonly selectionSummaryByOp = signal<Record<number, SelectionSummary>>({});

  protected setSelectionSummary(opRowid: number, summary: SelectionSummary): void {
    this.selectionSummaryByOp.update((byOp) => ({ ...byOp, [opRowid]: summary }));
  }

  // Units picked in an OP (0 when none); the last reported summary survives collapsing the accordion.
  protected selectedUnitsOf(opRowid: number): number {
    return this.selectionSummaryByOp()[opRowid]?.units ?? 0;
  }

  // OPs of the work center with units selected, with what the user picked and the units/time of it.
  private pickedOps(): PickedOp[] {
    const byOp = this.selectionSummaryByOp();
    return (this.rowObject.documents ?? [])
      .filter((doc) => (byOp[doc.op_rowid]?.units ?? 0) > 0)
      .map((doc) => ({ document: doc, selectedIds: this.selectedSkuIdsOf(doc.op_rowid), summary: byOp[doc.op_rowid], recordIds: this.selectedRecordIdsOf(doc.op_rowid) }));
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

  // Body of POST integration/tep/send/ for what is shown in the table.
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
    this.invalidAlertDismissed.set(false);
    this.selectionSummaryByOp.set({});
    this.selectedSkuIdsByOp.set({});
    this.selectedRecordIdsByOp.set({});
    super.closeModelForm();
  }

  protected toggleDocumentExpanded(index: number): void {
    // Only one OP stays open at a time: opening another one closes the previous one.
    this.expandedDocumentIndexes.set(this.expandedDocumentIndexes().has(index) ? new Set() : new Set([index]));
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
