import { SizeQtyDetail } from "./size-detail";
import { Totals } from "./totals";

export interface ColorDetail {
  color: string;
  totals: Totals[];
  sizes: SizeQtyDetail[];
}