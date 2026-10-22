import { Component, computed, input } from '@angular/core';
import { WorkCenterDocument } from '../../../../../../models/integration/order-by-work-center';
import { ProductionOrder } from '../../../../../../models/production/production-order';
import { SkuDetail } from '../../../../../../models/production/sku-detail';
import { ButtonBaseType } from '../../../../../../common/classes/button-base';
import { UiTableButton } from '../../../../../elements/ui-table-button/ui-table-button';
import { buildColorSizeMatrix } from '../../../../../components/production/tables/production-orders-table/color-size-matrix';

// How the quantity of each size is drawn: `plain` is the compact number (produced /
// ordered in the tooltip); `status` is the colored pill of ProductionOrdersTable
// (same colors, no click behavior).
export type DocumentProductionCellStyle = 'plain' | 'status';

// Confección integrate detail (origin_id = 1): compact read-only color x size table of
// the OP. Same pivot as ProductionOrdersTable, without its filter, mobile view or
// full-screen layout.
@Component({
  selector: 'app-document-production-table',
  imports: [UiTableButton],
  templateUrl: './document-production-table.html',
})
export class DocumentProductionTable {
  readonly document = input.required<WorkCenterDocument>();
  readonly cellStyle = input<DocumentProductionCellStyle>('plain');

  protected readonly matrix = computed(() => {
    const colorRows = this.document().detail?.colorRows;
    return colorRows?.length ? buildColorSizeMatrix({ colorRows } as ProductionOrder) : null;
  });

  // Placeholder cells (emptySize) have no real SKU: skuRowId 0 and no itemId.
  protected isRealSku(sku: SkuDetail): boolean {
    return sku.skuRowId !== 0 || !!sku.itemId;
  }

  protected producedQty(sku: SkuDetail): number {
    return Number(sku.completedQty) + Number(sku.rejectedQty) + Number(sku.wasteQty);
  }

  protected producedOverOrdered(sku: SkuDetail): string {
    return this.isRealSku(sku) ? `${this.producedQty(sku)} / ${sku.orderedQty}` : '';
  }

  // Same color rules as ProductionOrdersTable.getButtonIntent: complete, open records,
  // partially produced, or untouched.
  protected getButtonIntent(sku: SkuDetail): ButtonBaseType {
    if (this.producedQty(sku) === sku.orderedQty) return 'cancel';
    if (sku.hasOpenRecords === true) return 'action';
    if (this.producedQty(sku) > 0) return 'danger';
    return 'label';
  }
}
