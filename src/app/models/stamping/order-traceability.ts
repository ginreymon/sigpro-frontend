export interface OrderTraceabilityStampingAudit {
  isAudited: boolean;
  orderedQty: number;
  auditedQty: number;
  quantitiesMatch: boolean;
}

export interface OrderTraceabilityTracking {
  workCenterId: number;
  workCenterCode: string;
  workCenterName: string;
  timesInRoute: number;
  operation: string;
  qtyToExecute: number;
  qtyCompleted: number;
  isCompleted: boolean;
}

export interface OrderTraceability {
  rowId: number;
  documentId: string;
  documentType: string;
  documentNumber: number;
  reference: string;
  referenceRowId: number;
  product: string;
  createdAt: string;
  destination: string;
  status: number;
  statusName: string;
  orderedQty: number;
  plannedQty: number;
  completedQty: number;
  wasteQty: number;
  rejectedQty: number;
  stampingAudit: OrderTraceabilityStampingAudit | null;
  tracking: OrderTraceabilityTracking[];
}
