import { SkuDetail, SkuRecord } from '../../../../../../models/production/sku-detail';
import { SkuCellState } from '../../components/integration-cell-style';

// Placeholder cells (emptySize) have no real SKU: skuRowId 0 and no itemId.
export function isRealSku(sku: SkuDetail): boolean {
  return sku.skuRowId !== 0 || !!sku.itemId;
}

export function pendingRecords(sku: SkuDetail): SkuRecord[] {
  return (sku.records ?? []).filter((record) => !record.tep_processed);
}

// Quantity the next integration sends: what the SKU records hold (completed + scrap + rejected)
// minus what was already integrated. Both come from fn_cantidad_registrada_sku_op.
export function quantityToIntegrate(sku: SkuDetail): number {
  return Number(sku.recordedQuantity ?? 0) - Number(sku.integratedQuantity ?? 0);
}

// Completed + rejected + scrap units of the SKU.
export function producedUnits(sku: SkuDetail): number {
  return Number(sku.completedQty) + Number(sku.rejectedQty) + Number(sku.wasteQty);
}

// After integrating, the integrated total becomes the recorded one, so it is compared with the ordered
// quantity: equal = ready (completes the SKU), lower = partial. Without records (quantities coming only
// from the ERP) nothing can be integrated: completed units without records are a warning.
export function skuCellState(sku: SkuDetail): SkuCellState {
  const ordered = Number(sku.orderedQty);
  const recorded = Number(sku.recordedQuantity ?? 0);
  if (sku.tepProcessedAndComplete === true) return 'integrated';
  if (sku.hasOpenRecords === true) return 'open';
  if (!sku.records?.length && Number(sku.completedQty) > 0) return 'warning';
  if (recorded > 0 && recorded < ordered) return 'partial';
  if (recorded > 0 && recorded === ordered) return quantityToIntegrate(sku) > 0 ? 'ready' : 'complete';
  if (producedUnits(sku) === ordered) return 'complete';
  if (producedUnits(sku) > 0) return 'partial';
  return 'none';
}
