import { SkuDetail } from './sku-detail';
import { Totals } from './totals';

export interface ColorRowDetail {
  color: string;
  totals: Totals;
  skus: SkuDetail[];
}
