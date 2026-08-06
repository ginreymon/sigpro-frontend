import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { DatePipe, Location } from '@angular/common';
import { finalize } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { WorkSpaceLayout } from '../../../layouts/work-space-layout/work-space-layout';
import { UiTabs, TabItem } from '../../../shared/elements/ui-tabs/ui-tabs';
import { UiIcon } from '../../../shared/elements/ui-icon/ui-icon';
import { OrderHeader } from '../../../shared/components/production/cards/order-header/order-header';
import { OrderSkuAuditTable, OpColorRow } from '../../../shared/components/production/tables/order-sku-audit-table/order-sku-audit-table';
import { OrderSearcher } from '../../../shared/components/production/widgets/order-searcher/order-searcher';
import { DataTable } from '../../../shared/components/table/data-table/data-table';
import { BaseProductionOrderPage } from '../../../common/classes/base-production-order-page';
import { ProductionOrder } from '../../../models/production/production-order';
import { UiButton } from '../../../shared/elements/ui-button/ui-button';
import { UiBadge } from '../../../shared/elements/ui-badge/ui-badge';
import { SideModalLayout } from '../../../shared/components/layout/side-modal-layout/side-modal-layout';
import { Metadata } from '../../../shared/components/widgets/metadata/metadata';
import { AuditQuantityModal, AuditedColorQuantity } from '../../../shared/components/production/modals/audit-quantity-modal/audit-quantity-modal';
import { AuditQuantityModalService } from '../../../services/common/audit-quantity-modal-service';
import { DialogService } from '../../../services/common/dialog-service';
import { AuditRecordService } from '../../../services/stamping/audit-record-service';
import { AuditRecord, AuditRecordBulkPayload, AuditedOpSummary, AuditStatus } from '../../../models/stamping/audit-record';
import { PaginatedResponse } from '../../../common/interfaces/paginated-response';
import { TableColumn } from '../../../common/interfaces/table-column';
import { TableActions } from '../../../common/interfaces/table-actions';
import { TableActionEvent } from '../../../common/interfaces/table-action-event';
import { TableTemplate } from '../../../directives/table-template';

const TABS: TabItem[] = [
  { key: 'tab1', label: 'Orden OP' },
  { key: 'tab2', label: 'Auditorías' },
];

@Component({
  selector: 'app-stamping-auditory',
  imports: [WorkSpaceLayout, UiTabs, UiIcon, OrderHeader, OrderSkuAuditTable, OrderSearcher, UiButton, AuditQuantityModal, DataTable, TableTemplate, UiBadge, DatePipe, SideModalLayout, Metadata],
  templateUrl: './auditory.html',
})
export class StampingAuditory extends BaseProductionOrderPage {
  protected override loadExtras = false;

  private location = inject(Location);
  private auditQuantityModal = inject(AuditQuantityModalService);
  private dialogService = inject(DialogService);
  private auditRecordService = inject(AuditRecordService);

  private context = toSignal(this.contextService.context$, { initialValue: null });
  contextDocTypes = computed(() => this.context()?.docTypes ?? []);

  activeTab = signal('tab1');
  tabs = TABS;

  // Set whenever tab1 changes something that the tab2 audited-ops list could
  // reflect (e.g. editing a color's audited_quantity after the OP was
  // already confirmed, which changes its Auditada/Resultado columns).
  // confirmAuditBlock/deleteAuditBlock refresh the list themselves already,
  // so this flag only needs setting from the color-edit path.
  private auditedOpsDirty = false;

  // Unpaged full set for the loaded OP — feeds the "Orden OP" tab's
  // Auditada/Estado columns, which must see every color regardless of any
  // pager.
  protected auditRecordsAll = signal<AuditRecord[]>([]);
  // Instant "is_audited" flag for the loaded OP, from the lightweight status
  // endpoint (GET /audit-records/status/?docType=&docNumber=) — resolves as
  // soon as the OP is found, without waiting on the full per-color fetch.
  protected auditStatus = signal<AuditStatus | null>(null);
  // Full color set for the loaded OP at the moment a row's edit icon was
  // clicked — needed to merge the modal's single-color result back into a
  // complete replaceBulk payload (the other colors must survive the replace).
  private currentAuditRecords: AuditRecord[] = [];

  // "Auditoría" tab — global list of every OP already confirmed
  // (is_audited=True), independent of whichever OP is loaded in "Orden OP".
  // Most recently audited first (backend orders by -updated_at).
  protected auditedOpsResponse = signal<PaginatedResponse<AuditedOpSummary> | null>(null);
  private auditedOpsPage = 1;
  private auditedOpsLimit = environment.DEFAULT_PAGE_SIZE;
  private auditedOpsSearchTerm = '';

  protected auditedOpsColumns: TableColumn<AuditedOpSummary>[] = [
    { field: 'op_type', label: 'Tipo' },
    { field: 'op_number', label: 'OP' },
    { field: 'total_ordered_quantity', label: 'Ordenada', align: 'right' },
    { field: 'total_audited_quantity', label: 'Auditada', align: 'right' },
    { field: 'matches_total', label: 'Resultado', type: 'template', templateName: 'matchesTotalTemplate', align: 'center' },
    { field: 'updated_by_username', label: 'Auditada por' },
    { field: 'updated_at', label: 'Fecha auditoría', type: 'template', templateName: 'auditedAtTemplate' },
  ];

  protected auditedOpsActions: TableActions = {
    view: { enabled: true, title: 'Detalle auditoría', iconName: 'eye', toolTip: 'Ver detalle' },
    edit: { enabled: false },
    delete: { enabled: true, title: 'Eliminar auditoría', iconName: 'trash', toolTip: 'Eliminar' },
    create: { enabled: false },
  };

  // Side-modal detail for a row in the "Auditoría" tab's audited-ops list —
  // the per-color breakdown fetched on demand (the list itself only carries
  // OP-level totals) plus the row's own audit metadata.
  protected selectedAuditedOp = signal<AuditedOpSummary | null>(null);
  protected selectedAuditedOpRecords = signal<AuditRecord[]>([]);

  protected hasAuditRecords = computed(() => this.auditRecordsAll().length > 0);

  // Every color in the OP has an audit entry — even a 0 counts, it just
  // means the auditor reviewed that color. This gates the "Confirmar"
  // button: you must review every color before closing out the audit,
  // whether or not the counts actually match.
  protected allColorsAudited = computed(() => {
    const order = this.productionOrder();
    const records = this.auditRecordsAll();
    if (!order || records.length === 0) return false;
    return records.length === order.colorRows.length;
  });

  // Global OP indicator (visible next to the tabs, either tab). "approved"
  // requires EVERY color to individually match — not just the OP-level sum
  // (matches_total), which can hide one color under-audited offsetting
  // another over-audited. "surplus" flags when a color was audited above its
  // ordered quantity, distinct from a plain "incomplete" (still short).
  protected opApprovalStatus = computed<'unaudited' | 'incomplete' | 'surplus' | 'approved'>(() => {
    const records = this.auditRecordsAll();
    if (records.length === 0) return 'unaudited';
    if (!this.allColorsAudited()) return 'incomplete';

    if (records.some((r) => r.audited_quantity > r.ordered_quantity)) return 'surplus';
    const allColorsMatch = records.every((r) => r.quantities_match);
    return allColorsMatch ? 'approved' : 'incomplete';
  });

  protected isConfirmed = computed(() => this.auditRecordsAll().some((r) => r.is_audited));

  // % of quantity audited — total ordered quantity across every color of the
  // OP (100% baseline) vs. audited_quantity actually entered so far. Not the
  // color-count ratio: a color with 0 entered still counts as 0 toward the
  // numerator here, and colors with no entry yet at all also contribute 0.
  protected auditedQuantityPercentage = computed(() => {
    const colors = this.productionOrder()?.colorRows ?? [];
    const totalOrdered = colors.reduce((sum, c) => sum + (Number(c.totals?.[0]?.orderedQty) || 0), 0);
    if (totalOrdered === 0) return 0;

    const totalAudited = this.auditRecordsAll().reduce((sum, r) => sum + r.audited_quantity, 0);
    return Math.round((totalAudited / totalOrdered) * 100);
  });

  // "Orden OP" tab table — row-level edit opens the same per-color audit
  // modal as the "Auditoría" tab, whether that color has been audited yet or not.
  protected opTableActions: TableActions = {
    view: { enabled: false },
    edit: { enabled: true, title: 'Editar color', iconName: 'pencil', toolTip: 'Editar' },
    delete: { enabled: false },
    create: { enabled: false },
  };

  protected override beforeLoad(): void {
    this.activeTab.set('tab1');
  }

  onTabChange(key: string): void {
    this.activeTab.set(key);
    if (key === 'tab2' && this.auditedOpsDirty) {
      this.auditedOpsDirty = false;
      this.loadAuditedOps();
    }
  }

  override ngOnInit(): void {
    super.ngOnInit();
    this.loadAuditedOps();
  }

  goToSearch(): void {
    this.productionOrder.set(null);
    this.auditRecordsAll.set([]);
    this.auditStatus.set(null);
  }

  override setDocument(doc: ProductionOrder | null): void {
    this.productionOrder.set(doc);
    if (!doc) return;
    const tree = this.router.createUrlTree([], {
      queryParams: { docType: doc.documentType, docNumber: doc.documentNumber },
      queryParamsHandling: 'merge',
    });
    this.location.replaceState(this.router.serializeUrl(tree));

    this.loadAuditStatus(doc);
    this.loadAllAuditRecords();
  }

  private loadAuditStatus(order: ProductionOrder): void {
    this.auditRecordService
      .getStatus(order.documentType, order.documentNumber)
      .subscribe((status) => this.auditStatus.set(status));
  }

  private loadAllAuditRecords(): void {
    const order = this.productionOrder();
    if (!order) return;

    this.auditRecordService
      .all({ op_number: order.documentNumber, op_rowid: order.rowId, op_type: order.documentType })
      .subscribe((records) => this.auditRecordsAll.set(records));
  }

  private loadAuditedOps(): void {
    const offset = (this.auditedOpsPage - 1) * this.auditedOpsLimit;
    this.auditRecordService
      .getAuditedOps(this.auditedOpsLimit, offset, this.auditedOpsSearchTerm)
      .subscribe((res) => this.auditedOpsResponse.set(res));
  }

  auditedOpsPagerHandler(value: { page: number; pageSize: number }): void {
    this.auditedOpsPage = value.page;
    this.auditedOpsLimit = value.pageSize;
    this.loadAuditedOps();
  }

  // Search by op_number, same pattern as PaginatedCrudPage.searchHandler.
  auditedOpsSearchHandler(value: string): void {
    this.auditedOpsSearchTerm = value;
    this.auditedOpsPage = 1;
    this.loadAuditedOps();
  }

  onAuditedOpAction(event: TableActionEvent<AuditedOpSummary>): void {
    if (event.type === 'delete') this.deleteAuditedOp(event.obj);
    if (event.type === 'view') this.viewAuditedOp(event.obj);
  }

  private viewAuditedOp(row: AuditedOpSummary): void {
    if (row.op_number == null || row.op_rowid == null || row.op_type == null) return;

    this.loaderService.showLoader();
    this.auditRecordService
      .all({ op_number: row.op_number, op_rowid: row.op_rowid, op_type: row.op_type })
      .pipe(finalize(() => this.loaderService.hideLoader()))
      .subscribe((records) => {
        this.selectedAuditedOp.set(row);
        this.selectedAuditedOpRecords.set(records);
        this.dialogService.openSideModal('Detalle auditoría', 'Cerrar');
      });
  }

  protected closeAuditedOpDetail(): void {
    this.dialogService.closeModal();
  }

  private deleteAuditedOp(row: AuditedOpSummary): void {
    if (row.op_number == null || row.op_rowid == null || row.op_type == null) return;

    this.dialogService.openConfirm(
      'Eliminar auditoría',
      `¿Eliminar la auditoría de la OP ${row.op_number}?`,
      'Eliminar',
      () => {
        this.dialogService.closeConfirm();
        this.loaderService.showLoader();
        this.auditRecordService
          .deleteBulk(row.op_number!, row.op_rowid!, row.op_type!)
          .pipe(finalize(() => this.loaderService.hideLoader()))
          .subscribe({
            next: () => {
              this.loadAuditedOps();

              // The deleted block might be the one currently loaded in "Orden OP".
              const current = this.productionOrder();
              if (current && current.documentNumber === row.op_number && current.documentType === row.op_type) {
                this.auditRecordsAll.set([]);
                this.auditStatus.set(null);
              }

              this.dialogService.openToast('Auditoría eliminada', `Se eliminó la auditoría de la OP ${row.op_number}.`, 'check');
            },
            error: () => {
              this.dialogService.openToast('No se pudo eliminar', 'Error al eliminar la auditoría.', 'fail');
            },
          });
      },
    );
  }

  onOpTableAction(event: TableActionEvent<OpColorRow>): void {
    if (event.type !== 'edit') return;
    this.openColorEditModal(event.obj.color);
  }

  private openColorEditModal(color: string): void {
    const order = this.productionOrder();
    if (!order) return;

    this.loaderService.showLoader();
    this.auditRecordService
      .all({ op_number: order.documentNumber, op_rowid: order.rowId, op_type: order.documentType })
      .pipe(finalize(() => this.loaderService.hideLoader()))
      .subscribe((records) => {
        this.currentAuditRecords = records;
        const existingQuantity = records.find((r) => r.color === color)?.audited_quantity ?? null;
        this.auditQuantityModal.open(order, color, existingQuantity);
      });
  }

  deleteAuditBlock(): void {
    const order = this.productionOrder();
    if (!order) return;

    this.dialogService.openConfirm(
      'Eliminar auditoría',
      `¿Eliminar la auditoría de la OP ${order.documentNumber}?`,
      'Eliminar',
      () => {
        this.dialogService.closeConfirm();
        this.loaderService.showLoader();
        this.auditRecordService
          .deleteBulk(order.documentNumber, order.rowId, order.documentType)
          .pipe(finalize(() => this.loaderService.hideLoader()))
          .subscribe({
            next: () => {
              this.auditRecordsAll.set([]);
              this.auditStatus.set(null);
              this.loadAuditedOps();
              this.dialogService.openToast('Auditoría eliminada', `Se eliminó la auditoría de la OP ${order.documentNumber}.`, 'check');
            },
            error: () => {
              this.dialogService.openToast('No se pudo eliminar', 'Error al eliminar la auditoría.', 'fail');
            },
          });
      },
    );
  }

  confirmAuditBlock(): void {
    const order = this.productionOrder();
    if (!order) return;

    this.loaderService.showLoader();
    this.auditRecordService
      .confirmBulk(order.documentNumber, order.rowId, order.documentType)
      .pipe(finalize(() => this.loaderService.hideLoader()))
      .subscribe({
        next: (records) => {
          this.auditRecordsAll.set(records);
          this.loadAuditedOps();
          this.dialogService.openToast('Auditoría confirmada', `Se confirmó la auditoría de la OP ${order.documentNumber}.`, 'check');
          this.activeTab.set('tab2');
        },
        error: () => {
          this.dialogService.openToast('No se pudo confirmar', 'Error al confirmar la auditoría.', 'fail');
        },
      });
  }

  onAuditQuantitySaved(row: AuditedColorQuantity): void {
    const order = this.productionOrder();
    if (!order) return;

    // The modal only carries the edited color — merge it back into the full
    // set fetched when it was opened so replaceBulk (which replaces the
    // whole block, not a single row) doesn't drop the other colors. When the
    // block doesn't exist yet, currentAuditRecords is empty and this just
    // creates it with the one color.
    const finalRows = this.mergeWithCurrentRecords(row);

    const payload: AuditRecordBulkPayload = {
      op_number: order.documentNumber,
      op_rowid: order.rowId,
      op_type: order.documentType,
      total_ordered_quantity: finalRows.reduce((sum, r) => sum + r.orderedQty, 0),
      colors: finalRows.map((r) => ({
        color: r.color,
        sku_rowids: r.skuRowIds,
        ordered_quantity: r.orderedQty,
        audited_quantity: r.quantity,
      })),
    };

    this.loaderService.showLoader();
    this.auditRecordService
      .replaceBulk(payload)
      .pipe(finalize(() => this.loaderService.hideLoader()))
      .subscribe({
        next: () => {
          this.loadAllAuditRecords();
          this.auditedOpsDirty = true;
          this.dialogService.openToast('Auditoría guardada', `Se registró la cantidad auditada de ${row.color}.`, 'check');
        },
        error: () => {
          this.dialogService.openToast('No se pudo guardar', 'Error al guardar la auditoría.', 'fail');
        },
      });
  }

  private mergeWithCurrentRecords(edited: AuditedColorQuantity): AuditedColorQuantity[] {
    const others = this.currentAuditRecords
      .filter((r) => r.color !== edited.color)
      .map((r) => ({
        color: r.color,
        quantity: r.audited_quantity,
        orderedQty: r.ordered_quantity,
        skuRowIds: r.sku_rowids,
      }));
    return [...others, edited];
  }
}
