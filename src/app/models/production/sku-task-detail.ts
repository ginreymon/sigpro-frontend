export interface SkuTaskDetail {
  opRowId: number;
  opType: string;
  opNumber: number;
  reference: string;
  description: string;
  color: string;
  size: string;
  skuRowId: number;
  orderedQty: number;
  plannedQty: number;
  completedQty: number;
  wasteQty: number;
  rejectedQty: number;
  baseRouteQuantity: number;
  hasOpenRecords: boolean;
}
