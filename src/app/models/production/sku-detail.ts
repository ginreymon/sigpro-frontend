import { Totals } from './totals';

// Production record of a SKU inside an OP, with its TEP submission state.
export interface SkuRecord {
  id: number;
  ordered_quantity: number | null;
  planned_quantity: number | null;
  completed_quantity: number | null;
  scrap_quantity: number | null;
  rejected_quantity: number | null;
  recorded_quantity: number | null;
  tep_submission_id: number | null;
  tep_processed: boolean;
}

export interface SkuDetail extends Totals {
  size: string;
  skuRowId: number;
  hasOpenRecords?: boolean;
  baseRouteQuantity?: number;
  itemId?: string;
  tepProcessed?: boolean;
  records?: SkuRecord[];
}
