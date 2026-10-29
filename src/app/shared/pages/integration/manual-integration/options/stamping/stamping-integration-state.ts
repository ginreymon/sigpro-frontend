import { IntegrationReferenceSam } from '../../../../../../models/integration/order-by-work-center';
import { SkuRecord } from '../../../../../../models/production/sku-detail';
import { CELL_STATE_CLASSES, CELL_STATE_LABELS } from '../../components/integration-cell-style';

// Display state of the stamping OP selector: `ready` = it can be picked, `none` = it cannot.
export type SamIntegrationState = 'ready' | 'none';

// Same labels and looks as the Confección matrix cells, so both origins read the same.
export const SAM_STATE_LABELS: Record<SamIntegrationState, string> = {
  ready: CELL_STATE_LABELS.ready,
  none: 'Sin registros',
};

export const SAM_STATE_CLASSES: Record<SamIntegrationState, string> = {
  ready: CELL_STATE_CLASSES.ready,
  none: CELL_STATE_CLASSES.none,
};

// Records of the SAM still to be integrated.
export function pendingSamRecords(sam: IntegrationReferenceSam): SkuRecord[] {
  return (sam.records ?? []).filter((record) => !record.tep_processed);
}
