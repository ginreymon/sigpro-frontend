import { OperationCenter } from '../production/operation-center';
import { StampingReferenceSam } from './stamping-reference-sam';

export interface StampingOrderDetail {
  rowId: number;
  documentType: string;
  documentNumber: number;
  reference: string;
  referenceRowId: number;
  description: string;
  product: string;
  createdAt: string;
  destination: string;
  status: number;
  documentId: string;
  orderedQty: number;
  stampedQty: number;
  pendingQty: number;
  operationCenters: OperationCenter[];
  referenceSams: StampingReferenceSam[];
}
