import { IntegrationReferenceSam } from '../../../../../../models/integration/order-by-work-center';
import { SkuRecord } from '../../../../../../models/production/sku-detail';
import { CELL_STATE_CLASSES, CELL_STATE_LABELS } from '../production/integration-state';

// Integration state of a SAM of a stamping OP (the unit that is picked in the integrate modal):
// `integrated` = it has records and all of them were already sent to TEP and processed,
// `ready`      = it has records still to be integrated (the only selectable state),
// `none`       = it has no records yet (or the API did not send the TEP flag).
export type SamIntegrationState = 'integrated' | 'ready' | 'none';

// Same labels and looks as the Confección matrix cells, so both origins read the same.
export const SAM_STATE_LABELS: Record<SamIntegrationState, string> = {
  integrated: CELL_STATE_LABELS.integrated,
  ready: CELL_STATE_LABELS.ready,
  none: 'Sin registros',
};

export const SAM_STATE_CLASSES: Record<SamIntegrationState, string> = {
  integrated: CELL_STATE_CLASSES.integrated,
  ready: CELL_STATE_CLASSES.ready,
  none: CELL_STATE_CLASSES.none,
};

export function samIntegrationState(sam: IntegrationReferenceSam): SamIntegrationState {
  if (!sam.records?.length) return 'none';
  // Strict like the Confección cells: without the TEP flag the SAM cannot be offered for integration.
  if (sam.tepProcessed === true) return 'integrated';
  if (sam.tepProcessed === false) return 'ready';
  return 'none';
}

export function pendingSamRecords(sam: IntegrationReferenceSam): SkuRecord[] {
  return (sam.records ?? []).filter((record) => !record.tep_processed);
}

// Units that would be integrated by picking the SAM: recorded units of its pending records.
export function pendingSamUnits(sam: IntegrationReferenceSam): number {
  return pendingSamRecords(sam).reduce((sum, record) => sum + Number(record.recorded_quantity ?? 0), 0);
}

// Ordered units of the SAM, in pieces: OP ordered quantity x stamped_pieces. The API does not send
// it, but fn_referencias_sam_estampacion_op defines pending_qty = ordered x pieces - stamped_qty,
// so ordered = stamped_qty + pending_qty (same figure app-stamping-record works with).
export function samOrderedQty(sam: IntegrationReferenceSam): number {
  return Number(sam.stamped_qty ?? 0) + Number(sam.pending_qty ?? 0);
}

// Units still to stamp ("Por hacer"). pending_qty goes negative when more than ordered was
// stamped; the card never shows less than 0.
export function samPendingQty(sam: IntegrationReferenceSam): number {
  return Math.max(Number(sam.pending_qty ?? 0), 0);
}
