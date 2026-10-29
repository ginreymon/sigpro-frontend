import { SkuDetail, SkuRecord } from '../../../../../../models/production/sku-detail';
import { SkuCellState } from '../../components/integration-cell-style';

// Placeholder cells (emptySize) have no real SKU: skuRowId 0 and no itemId.
export function isRealSku(sku: SkuDetail): boolean {
  return sku.skuRowId !== 0 || !!sku.itemId;
}

export function pendingRecords(sku: SkuDetail): SkuRecord[] {
  return (sku.records ?? []).filter((record) => !record.tep_processed);
}

// Completed units of the SKU records that were not sent to TEP yet.
function pendingCompletedUnits(sku: SkuDetail): number {
  return pendingRecords(sku).reduce((sum, record) => sum + Number(record.completed_quantity ?? 0), 0);
}

// Units a picked cell adds to the integration: every completed unit of a ready cell, only the
// still-pending completed units of a partial one (part of it may have been integrated before).
// A partial cell with no records has none, so it cannot be picked.
export function unitsToIntegrate(sku: SkuDetail): number {
  return skuCellState(sku) === 'ready' ? Number(sku.completedQty) : pendingCompletedUnits(sku);
}

// Completed + rejected + scrap units of the SKU.
export function producedUnits(sku: SkuDetail): number {
  return Number(sku.completedQty) + Number(sku.rejectedQty) + Number(sku.wasteQty);
}

export function skuCellState(sku: SkuDetail): SkuCellState {
  const ordered = Number(sku.orderedQty);
  if (Number(sku.completedQty) === ordered) {
    if (sku.totalTepProcessed === true) return 'integrated';
    if (sku.totalTepProcessed === false) return 'ready';
  }
  if (producedUnits(sku) === ordered) return 'complete';
  if (sku.hasOpenRecords === true) return 'open';
  if (producedUnits(sku) > 0) return 'partial';
  return 'none';
}
