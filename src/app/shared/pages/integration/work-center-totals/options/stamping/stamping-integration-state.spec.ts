import { IntegrationReferenceSam } from '../../../../../../models/integration/order-by-work-center';
import { SkuRecord } from '../../../../../../models/production/sku-detail';
import { pendingSamRecords, pendingSamUnits, samIntegrationState } from './stamping-integration-state';

const record = (id: number, processed: boolean, units = 10): SkuRecord =>
  ({ id, recorded_quantity: units, tep_processed: processed }) as unknown as SkuRecord;

const sam = (records: SkuRecord[], tepProcessed?: boolean): IntegrationReferenceSam =>
  ({ id: 1, records, tepProcessed }) as unknown as IntegrationReferenceSam;

describe('stamping integration state', () => {
  describe('samIntegrationState', () => {
    it('is none when the SAM has no records', () => {
      expect(samIntegrationState(sam([]))).toBe('none');
    });

    it('is integrated when all records were processed by TEP', () => {
      expect(samIntegrationState(sam([record(1, true), record(2, true)], true))).toBe('integrated');
    });

    it('is ready when it has records still pending', () => {
      expect(samIntegrationState(sam([record(1, true), record(2, false)], false))).toBe('ready');
    });

    it('is none when the API did not send the TEP flag, so it cannot be offered for integration', () => {
      expect(samIntegrationState(sam([record(1, false)], undefined))).toBe('none');
    });
  });

  describe('pending records and units', () => {
    const pending = sam([record(1, true, 5), record(2, false, 7), record(3, false, 3)]);

    it('keeps only the records not yet processed', () => {
      expect(pendingSamRecords(pending).map((r) => r.id)).toEqual([2, 3]);
    });

    it('sums the recorded quantity of the pending records', () => {
      expect(pendingSamUnits(pending)).toBe(10);
    });

    it('is 0 when there is nothing pending', () => {
      expect(pendingSamUnits(sam([record(1, true)]))).toBe(0);
      expect(pendingSamUnits(sam([]))).toBe(0);
    });
  });
});
