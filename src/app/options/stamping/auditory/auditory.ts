import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Location } from '@angular/common';
import { finalize } from 'rxjs';
import { WorkSpaceLayout } from '../../../layouts/work-space-layout/work-space-layout';
import { UiTabs, TabItem } from '../../../shared/elements/ui-tabs/ui-tabs';
import { UiIcon } from '../../../shared/elements/ui-icon/ui-icon';
import { OrderHeader } from '../../../shared/components/production/cards/order-header/order-header';
import { ProductionOrdersTable } from '../../../shared/components/production/tables/production-orders-table/production-orders-table';
import { OrderSearcher } from '../../../shared/components/production/widgets/order-searcher/order-searcher';
import { BaseProductionOrderPage } from '../../../common/classes/base-production-order-page';
import { ProductionOrder } from '../../../models/production/production-order';
import { UiButton } from '../../../shared/elements/ui-button/ui-button';
import { AuditQuantityModal, AuditedColorQuantity } from '../../../shared/components/production/modals/audit-quantity-modal/audit-quantity-modal';
import { AuditQuantityModalService } from '../../../services/common/audit-quantity-modal-service';
import { DialogService } from '../../../services/common/dialog-service';
import { AuditRecordService } from '../../../services/stamping/audit-record-service';
import { AuditRecordBulkPayload } from '../../../models/stamping/audit-record';

const TABS: TabItem[] = [
  { key: 'tab1', label: 'Orden OP' },
  { key: 'tab2', label: 'Auditoría' },
];

@Component({
  selector: 'app-stamping-auditory',
  imports: [WorkSpaceLayout, UiTabs, UiIcon, OrderHeader, ProductionOrdersTable, OrderSearcher, UiButton, AuditQuantityModal],
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

  protected override beforeLoad(): void {
    this.activeTab.set('tab1');
  }

  onTabChange(key: string): void {
    this.activeTab.set(key);
  }

  goToSearch(): void {
    this.productionOrder.set(null);
  }

  override setDocument(doc: ProductionOrder | null): void {
    this.productionOrder.set(doc);
    if (!doc) return;
    const tree = this.router.createUrlTree([], {
      queryParams: { docType: doc.documentType, docNumber: doc.documentNumber },
      queryParamsHandling: 'merge',
    });
    this.location.replaceState(this.router.serializeUrl(tree));
  }

  openAuditQuantityModal(): void {
    const order = this.productionOrder();
    if (order) this.auditQuantityModal.open(order);
  }

  onAuditQuantitySaved(rows: AuditedColorQuantity[]): void {
    const order = this.productionOrder();
    if (!order) return;

    const payload: AuditRecordBulkPayload = {
      op_number: order.documentNumber,
      op_rowid: order.rowId,
      op_type: order.documentType,
      total_op_quantity: rows.reduce((sum, row) => sum + row.orderedQty, 0),
      colors: rows.map((row) => ({
        color: row.color,
        sku_rowids: row.skuRowIds,
        ordered_quantity: row.orderedQty,
        audited_quantity: row.quantity,
      })),
    };

    this.loaderService.showLoader();
    this.auditRecordService.createBulk(payload)
      .pipe(finalize(() => this.loaderService.hideLoader()))
      .subscribe({
        next: () => {
          this.dialogService.openToast('Auditoría guardada', `Se registraron las cantidades de ${rows.length} color(es).`, 'check');
        },
        error: () => {
          this.dialogService.openToast('No se pudo guardar', 'Error al guardar la auditoría.', 'fail');
        },
      });
  }
}
