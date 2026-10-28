import { SkuDetail, SkuRecord } from '../../../../../../models/production/sku-detail';
import { SkuCellState } from '../../components/integration-cell-style';

// Placeholder cells (emptySize) have no real SKU: skuRowId 0 and no itemId.
export function isRealSku(sku: SkuDetail): boolean {
  return sku.skuRowId !== 0 || !!sku.itemId;
}

export function pendingRecords(sku: SkuDetail): SkuRecord[] {
  return (sku.records ?? []).filter((record) => !record.tep_processed);
}

// Completed + rejected + scrap units of the SKU.
export function producedUnits(sku: SkuDetail): number {
  return Number(sku.completedQty) + Number(sku.rejectedQty) + Number(sku.wasteQty);
}

export function skuCellState(sku: SkuDetail): SkuCellState {
  const ordered = Number(sku.orderedQty);
  if (Number(sku.completedQty) === ordered) {
    if (sku.tepProcessed === true) return 'integrated';
    if (sku.tepProcessed === false) return 'ready';
  }
  if (producedUnits(sku) === ordered) return 'complete';
  if (sku.hasOpenRecords === true) return 'open';
  if (producedUnits(sku) > 0) return 'partial';
  return 'none';
}
