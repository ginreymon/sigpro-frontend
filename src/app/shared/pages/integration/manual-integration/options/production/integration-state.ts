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

// Units one record adds to an integration (completed + scrap + rejected).
export function recordUnits(record: SkuRecord): number {
  return Number(
    record.recorded_quantity ??
      Number(record.completed_quantity ?? 0) + Number(record.scrap_quantity ?? 0) + Number(record.rejected_quantity ?? 0),
  );
}

// Single-quantity mode: picks whole records (they cannot be split) whose units add up to `quantity`, preferring
// the earliest ones. When no combination matches, `below`/`above` are the closest quantities that do.
export function pickRecordsForQuantity(
  records: SkuRecord[],
  quantity: number,
): { ids: number[]; exact: boolean; below: number; above: number | null } {
  const units = records.map(recordUnits);
  const dead = new Set<string>();
  const solve = (index: number, remaining: number): number[] | null => {
    if (remaining === 0) return [];
    if (remaining < 0 || index >= units.length || dead.has(`${index}:${remaining}`)) return null;
    const withRecord = units[index] > 0 ? solve(index + 1, remaining - units[index]) : null;
    const found = withRecord ? [index, ...withRecord] : solve(index + 1, remaining);
    if (!found) dead.add(`${index}:${remaining}`);
    return found;
  };
  const picked = solve(0, quantity);
  if (picked) return { ids: picked.map((index) => records[index].id), exact: true, below: quantity, above: quantity };

  const reachable = units.reduce((sums, unit) => new Set([...sums, ...[...sums].map((sum) => sum + unit)]), new Set([0]));
  const sorted = [...reachable].sort((a, b) => a - b);
  return {
    ids: [],
    exact: false,
    below: sorted.filter((sum) => sum < quantity).pop() ?? 0,
    above: sorted.find((sum) => sum > quantity) ?? null,
  };
}

// Single-quantity mode: ids of the records that back `quantity` units. Whole records that add up exactly when
// possible; otherwise the earliest ones until they cover it (the last one may hold more than is integrated).
// Empty when the records do not reach the quantity.
export function pickRecordsCovering(records: SkuRecord[], quantity: number): number[] {
  const exact = pickRecordsForQuantity(records, quantity);
  if (exact.exact) return exact.ids;
  const ids: number[] = [];
  let sum = 0;
  for (const record of records) {
    if (sum >= quantity) break;
    if (recordUnits(record) > 0) {
      ids.push(record.id);
      sum += recordUnits(record);
    }
  }
  return sum >= quantity ? ids : [];
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
