import { SkuDetail, SkuRecord } from '../../../../../../models/production/sku-detail';

// Integration state of a SKU: `integrated` = every production record was sent to TEP and
// processed; `pending` = at least one record is still to be integrated; `none` = nothing
// recorded yet; `unknown` = the API did not send `tepProcessed` (function not deployed).
export type SkuIntegrationState = 'integrated' | 'pending' | 'none' | 'unknown';

export const STATE_LABELS: Record<SkuIntegrationState, string> = {
  integrated: 'Integrado',
  pending: 'Por integrar',
  none: 'Sin registros',
  unknown: 'Sin estado',
};

// Tailwind classes of the pill/cell of each state (same colors in every integration view).
export const STATE_CLASSES: Record<SkuIntegrationState, string> = {
  integrated: 'bg-green-100 text-green-700',
  pending: 'bg-amber-100 text-amber-700',
  none: 'bg-slate-100 text-slate-400',
  unknown: 'bg-white text-slate-700',
};

// Border of the matrix cell of each state; the gray states (no records / unknown) get no colored border.
export const STATE_BORDER_CLASSES: Record<SkuIntegrationState, string> = {
  integrated: 'border-green-500',
  pending: 'border-amber-500',
  none: 'border-transparent',
  unknown: 'border-transparent',
};

// Solid color of the progress-bar segment of each state.
export const STATE_BAR_CLASSES: Record<SkuIntegrationState, string> = {
  integrated: 'bg-green-500',
  pending: 'bg-amber-400',
  none: 'bg-slate-300',
  unknown: 'bg-slate-200',
};

// Placeholder cells (emptySize) have no real SKU: skuRowId 0 and no itemId.
export function isRealSku(sku: SkuDetail): boolean {
  return sku.skuRowId !== 0 || !!sku.itemId;
}

export function skuIntegrationState(sku: SkuDetail): SkuIntegrationState {
  if (sku.tepProcessed === undefined) return 'unknown';
  if (!sku.records?.length) return 'none';
  return sku.tepProcessed ? 'integrated' : 'pending';
}

export function pendingRecords(sku: SkuDetail): SkuRecord[] {
  return (sku.records ?? []).filter((record) => !record.tep_processed);
}

export function integratedRecords(sku: SkuDetail): SkuRecord[] {
  return (sku.records ?? []).filter((record) => record.tep_processed);
}

export function recordsUnits(records: SkuRecord[]): number {
  return records.reduce((sum, record) => sum + Number(record.recorded_quantity ?? 0), 0);
}

// Recorded units (completed + scrap + rejected) already integrated / still to integrate.
export function integratedUnits(sku: SkuDetail): number {
  return recordsUnits(integratedRecords(sku));
}

export function pendingUnits(sku: SkuDetail): number {
  return recordsUnits(pendingRecords(sku));
}

// Units still to be produced: ordered minus everything recorded (never below 0).
export function missingUnits(sku: SkuDetail): number {
  return Math.max(Number(sku.orderedQty) - integratedUnits(sku) - pendingUnits(sku), 0);
}

// Matrix cell state. The first two use the TEP flag, the rest follow getButtonIntent
// (production-orders-table):
//   integrated = completed = ordered and already processed by TEP,
//   ready      = completed = ordered and not processed yet (the only selectable state),
//   complete   = produced (completed + rejected + scrap) = ordered   ('cancel' intent),
//   open       = has open records                                    ('action' intent),
//   partial    = something produced                                  ('danger' intent),
//   none       = nothing produced (outline only: gray border, no fill).
export type SkuCellState = 'integrated' | 'ready' | 'complete' | 'open' | 'partial' | 'none';

export const CELL_STATE_LABELS: Record<SkuCellState, string> = {
  integrated: 'Integrado',
  ready: 'Por integrar',
  complete: 'Completo',
  open: 'Registros abiertos',
  partial: 'Parcial',
  none: 'Sin producción',
};

// Tailwind classes of each matrix cell (background, text and border). Intent colors come from ButtonBase.
export const CELL_STATE_CLASSES: Record<SkuCellState, string> = {
  integrated: 'bg-green-100 text-green-700 border-green-500',
  ready:
    'bg-brand-100 border-brand-300 cursor-pointer duration-200 font-semibold hover:bg-brand-200 hover:text-brand-900',
  complete: 'text-gray-600 border-transparent hover:bg-gray-100',
  open: 'text-gray-700 bg-gray-200 border-transparent hover:bg-gray-300',
  partial: 'text-red-700 bg-red-100 border-red-300 hover:bg-red-200',
  none: 'bg-transparent text-slate-500 border-slate-300',
};

// Replaces the `ready` look once the user picked the cell.
export const CELL_SELECTED_CLASSES = 'bg-brand-500 text-white border-brand-500';

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
