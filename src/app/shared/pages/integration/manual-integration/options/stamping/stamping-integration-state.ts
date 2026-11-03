import { IntegrationReferenceSam } from '../../../../../../models/integration/order-by-work-center';
import { SkuRecord } from '../../../../../../models/production/sku-detail';

// Records of the SAM still to be integrated.
export function pendingSamRecords(sam: IntegrationReferenceSam): SkuRecord[] {
  return (sam.records ?? []).filter((record) => !record.tep_processed);
}
