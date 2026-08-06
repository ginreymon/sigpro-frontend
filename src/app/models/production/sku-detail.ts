import { Totals } from './totals';

export interface SkuDetail extends Totals {
  size: string;
  skuRowId: number;
  hasOpenRecords?: boolean;
  baseRouteQuantity?: number;
}
