import { ColorRowDetail } from '../production/color-row-detail';
import { ProductClassification } from '../production/product-classification';
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
  documentId: string;
  planId: string;
  sam?: number;
  docStatus?: number;
  docStatusName?: string;
  classification: ProductClassification;
  colorRows: ColorRowDetail[];
  orderedQty: number;
  referenceSams: StampingReferenceSam[];
}
