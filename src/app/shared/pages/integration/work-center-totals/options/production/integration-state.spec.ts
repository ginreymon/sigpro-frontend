import { SkuDetail } from '../../../../../../models/production/sku-detail';
import { producedUnits, skuCellState } from './integration-state';

const sku = (extra: Partial<SkuDetail> = {}): SkuDetail => ({
  size: 'M',
  skuRowId: 1,
  orderedQty: 10,
  plannedQty: 10,
  completedQty: 10,
  wasteQty: 0,
  rejectedQty: 0,
  ...extra,
});

describe('skuCellState', () => {
  it('is integrated when completed equals ordered and TEP processed it', () => {
    expect(skuCellState(sku({ tepProcessed: true }))).toBe('integrated');
  });

  it('is ready when completed equals ordered and TEP has not processed it', () => {
    expect(skuCellState(sku({ tepProcessed: false }))).toBe('ready');
  });

  it('is open when it has open records, even if something was produced', () => {
    expect(skuCellState(sku({ completedQty: 4, hasOpenRecords: true }))).toBe('open');
  });

  it('is partial when something was produced and nothing is open', () => {
    expect(skuCellState(sku({ completedQty: 4 }))).toBe('partial');
    expect(skuCellState(sku({ completedQty: 0, rejectedQty: 2 }))).toBe('partial');
  });

  it('is none when nothing was produced', () => {
    expect(skuCellState(sku({ completedQty: 0 }))).toBe('none');
  });

  it('is not ready/integrated without TEP data even if completed equals ordered', () => {
    expect(skuCellState(sku())).toBe('complete'); // produced = ordered: 'cancel' intent
  });

  it('is complete when completed + rejected + scrap equals ordered but completed does not', () => {
    expect(skuCellState(sku({ completedQty: 8, rejectedQty: 2, wasteQty: 0, tepProcessed: false }))).toBe('complete');
  });

  it('is none (label intent) when nothing was produced', () => {
    expect(skuCellState(sku({ completedQty: 0, rejectedQty: 0, wasteQty: 0, hasOpenRecords: false }))).toBe('none');
  });
});

describe('producedUnits', () => {
  it('adds completed, rejected and scrap units', () => {
    expect(producedUnits(sku({ completedQty: 6, rejectedQty: 1, wasteQty: 2 }))).toBe(9);
  });
});
