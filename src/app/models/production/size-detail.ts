import { Totals } from './totals';

export interface SizeQtyDetail extends Totals {
  size: string;
  skuRowId: number;
  hasOpenRecords?: boolean;
  baseRouteQuantity?: number;
  sam?: number | null;
}
