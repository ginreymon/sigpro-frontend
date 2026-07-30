import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Location } from '@angular/common';
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
import { AuditQuantityModal, AuditedColorQuantity } from '../../../shared/components/production/modals/audit-quantity-modal/audit-quantity-modal';
import { AuditQuantityModalService } from '../../../services/common/audit-quantity-modal-service';
import { DialogService } from '../../../services/common/dialog-service';
import { AuditRecordService } from '../../../services/stamping/audit-record-service';
import { AuditRecord, AuditRecordBulkPayload } from '../../../models/stamping/audit-record';
import { PaginatedResponse } from '../../../common/interfaces/paginated-response';
import { TableColumn } from '../../../common/interfaces/table-column';
import { TableActions } from '../../../common/interfaces/table-actions';
import { TableActionEvent } from '../../../common/interfaces/table-action-event';
import { TableTemplate } from '../../../directives/table-template';

const TABS: TabItem[] = [
  { key: 'tab1', label: 'Orden OP' },
  { key: 'tab2', label: 'Auditoría' },
];

@Component({
  selector: 'app-stamping-auditory',
  imports: [WorkSpaceLayout, UiTabs, UiIcon, OrderHeader, OrderSkuAuditTable, OrderSearcher, UiButton, AuditQuantityModal, DataTable, TableTemplate, UiBadge],
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

  // "Auditoría" tab table — reads the AuditRecord block already saved for the
  // loaded OP (one row per color). Records are managed in bulk per OP, so
  // "edit" reopens the modal with the whole block prefilled instead of
  // patching a single row.
  protected auditRecordsResponse = signal<PaginatedResponse<AuditRecord> | null>(null);
  private editingAuditBlock = signal(false);
  // Full color set for the loaded OP at the moment an edit (whole-block or
  // single-row) was opened — needed to merge the modal's result (which may
  // only contain one color) back into a complete replaceBulk payload.
  private currentAuditRecords: AuditRecord[] = [];
  private auditPage = 1;
  private auditLimit = environment.DEFAULT_PAGE_SIZE;

  // Delete acts on the whole OP block, so it's a plain button above the
  // table. Edit is available both per-row (single color) and as a
  // whole-block button.
  protected auditColumns: TableColumn<AuditRecord>[] = [
    { field: 'color', label: 'Color' },
    { field: 'ordered_quantity', label: 'Ordenada', align: 'right' },
    { field: 'audited_quantity', label: 'Auditada', type: 'template', templateName: 'auditedQtyTemplate', align: 'right' },
    { field: 'quantities_match', label: 'Autorizado', type: 'template', templateName: 'authorizedTemplate', align: 'center' },
  ];

  // Footer totals the currently displayed page — matches_total coloring is
  // validated per color/row only, the footer is a plain sum.
  protected auditFooter = computed<AuditRecord[]>(() => {
    const rows = this.auditRecordsResponse()?.results ?? [];
    if (!rows.length) return [];

    return [
      {
        ordered_quantity: rows.reduce((sum, r) => sum + r.ordered_quantity, 0),
        audited_quantity: rows.reduce((sum, r) => sum + r.audited_quantity, 0),
      } as AuditRecord,
    ];
  });

  protected auditActions: TableActions = {
    view: { enabled: false },
    edit: { enabled: true, title: 'Editar color', iconName: 'pencil', toolTip: 'Editar' },
    delete: { enabled: false },
    create: { enabled: false },
  };

  protected hasAuditRecords = computed(() => (this.auditRecordsResponse()?.count ?? 0) > 0);

  // "Orden OP" tab table — row-level edit reopens the same per-color audit
  // modal as the "Auditoría" tab, so it only makes sense once a block exists.
  protected opTableActions = computed<TableActions>(() => ({
    view: { enabled: false },
    edit: { enabled: this.hasAuditRecords(), title: 'Editar color', iconName: 'pencil', toolTip: 'Editar' },
    delete: { enabled: false },
    create: { enabled: false },
  }));

  protected override beforeLoad(): void {
    this.activeTab.set('tab1');
  }

  onTabChange(key: string): void {
    this.activeTab.set(key);
  }

  goToSearch(): void {
    this.productionOrder.set(null);
    this.auditRecordsResponse.set(null);
  }

  override setDocument(doc: ProductionOrder | null): void {
    this.productionOrder.set(doc);
    if (!doc) return;
    const tree = this.router.createUrlTree([], {
      queryParams: { docType: doc.documentType, docNumber: doc.documentNumber },
      queryParamsHandling: 'merge',
    });
    this.location.replaceState(this.router.serializeUrl(tree));

    this.auditPage = 1;
    this.loadAuditRecords();
  }

  private loadAuditRecords(): void {
    const order = this.productionOrder();
    if (!order) return;

    const offset = (this.auditPage - 1) * this.auditLimit;
    this.auditRecordService
      .getAll({
        limit: this.auditLimit,
        offset,
        filters: { op_number: order.documentNumber, op_rowid: order.rowId, op_type: order.documentType },
      })
      .subscribe((res) => this.auditRecordsResponse.set(res));
  }

  auditPagerHandler(value: { page: number; pageSize: number }): void {
    this.auditPage = value.page;
    this.auditLimit = value.pageSize;
    this.loadAuditRecords();
  }

  editAuditBlock(): void {
    this.fetchCurrentAuditRecords((order, records) => {
      this.auditQuantityModal.open(order, records);
    });
  }

  onAuditTableAction(event: TableActionEvent<AuditRecord>): void {
    if (event.type !== 'edit') return;
    this.openColorEditModal(event.obj.color);
  }

  onOpTableAction(event: TableActionEvent<OpColorRow>): void {
    if (event.type !== 'edit') return;
    this.openColorEditModal(event.obj.color);
  }

  private openColorEditModal(color: string): void {
    this.fetchCurrentAuditRecords((order, records) => {
      this.auditQuantityModal.open(order, records, color);
    });
  }

  private fetchCurrentAuditRecords(onLoaded: (order: ProductionOrder, records: AuditRecord[]) => void): void {
    const order = this.productionOrder();
    if (!order) return;

    this.loaderService.showLoader();
    this.auditRecordService
      .all({ op_number: order.documentNumber, op_rowid: order.rowId, op_type: order.documentType })
      .pipe(finalize(() => this.loaderService.hideLoader()))
      .subscribe((records) => {
        this.editingAuditBlock.set(true);
        this.currentAuditRecords = records;
        onLoaded(order, records);
      });
  }

  deleteAuditBlock(): void {
    const order = this.productionOrder();
    if (!order) return;

    this.dialogService.openConfirm(
      'Eliminar auditoría',
      `¿Está seguro de que desea eliminar el bloque de auditoría de la OP ${order.documentNumber}?`,
      'Eliminar',
      () => {
        this.dialogService.closeConfirm();
        this.loaderService.showLoader();
        this.auditRecordService
          .deleteBulk(order.documentNumber, order.rowId, order.documentType)
          .pipe(finalize(() => this.loaderService.hideLoader()))
          .subscribe({
            next: () => {
              this.auditPage = 1;
              this.loadAuditRecords();
              this.dialogService.openToast('Auditoría eliminada', 'Se eliminó el bloque de auditoría de la OP.', 'check');
            },
            error: () => {
              this.dialogService.openToast('No se pudo eliminar', 'Error al eliminar la auditoría.', 'fail');
            },
          });
      },
    );
  }

  openAuditQuantityModal(): void {
    const order = this.productionOrder();
    if (!order) return;
    this.editingAuditBlock.set(false);
    this.auditQuantityModal.open(order);
  }

  onAuditQuantitySaved(rows: AuditedColorQuantity[]): void {
    const order = this.productionOrder();
    if (!order) return;

    const isEdit = this.editingAuditBlock();
    // A row edit only carries its own color — merge it back into the full
    // set fetched when the modal was opened so replaceBulk doesn't drop the
    // other colors (it replaces the whole block, not a single row).
    const finalRows = isEdit ? this.mergeWithCurrentRecords(rows) : rows;

    const payload: AuditRecordBulkPayload = {
      op_number: order.documentNumber,
      op_rowid: order.rowId,
      op_type: order.documentType,
      total_ordered_quantity: finalRows.reduce((sum, row) => sum + row.orderedQty, 0),
      colors: finalRows.map((row) => ({
        color: row.color,
        sku_rowids: row.skuRowIds,
        ordered_quantity: row.orderedQty,
        audited_quantity: row.quantity,
      })),
    };

    const request$ = isEdit ? this.auditRecordService.replaceBulk(payload) : this.auditRecordService.createBulk(payload);

    this.loaderService.showLoader();
    request$
      .pipe(finalize(() => this.loaderService.hideLoader()))
      .subscribe({
        next: () => {
          this.editingAuditBlock.set(false);
          this.auditPage = 1;
          this.loadAuditRecords();
          const message = isEdit
            ? `Se actualizaron las cantidades de ${rows.length} color(es).`
            : `Se registraron las cantidades de ${rows.length} color(es).`;
          this.dialogService.openToast(isEdit ? 'Auditoría actualizada' : 'Auditoría guardada', message, 'check');
        },
        error: () => {
          this.dialogService.openToast('No se pudo guardar', 'Error al guardar la auditoría.', 'fail');
        },
      });
  }

  private mergeWithCurrentRecords(edited: AuditedColorQuantity[]): AuditedColorQuantity[] {
    const editedByColor = new Map(edited.map((row) => [row.color, row]));
    return this.currentAuditRecords.map(
      (record) =>
        editedByColor.get(record.color) ?? {
          color: record.color,
          quantity: record.audited_quantity,
          orderedQty: record.ordered_quantity,
          skuRowIds: record.sku_rowids,
        },
    );
  }
}
