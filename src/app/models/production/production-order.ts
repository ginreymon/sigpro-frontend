import { AuditInfo } from './audit-info';
import { BaseDocument } from './base-document';
import { BaseProduct } from './base-product';
import { ProductClassification } from './product-classification';
import { ColorDetail } from './color-detail';

export interface ProductionOrder extends BaseDocument, BaseProduct, AuditInfo {
  planId: string;
  sam?: number;
  statusInfo?: { state: number; name: string };
  classification: ProductClassification;
  colorRows: ColorDetail[];
}
