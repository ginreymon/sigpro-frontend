import { AuditInfo } from './audit-info';
import { BaseDocument } from './base-document';
import { BaseProduct } from './base-product';
import { ProductClassification } from './product-classification';
import { ColorRowDetail } from './color-row-detail';

export interface ProductionOrder extends BaseDocument, BaseProduct, AuditInfo {
  planId: string;
  sam?: number;
  statusInfo?: { state: number; name: string };
  classification: ProductClassification;
  colorRows: ColorRowDetail[];
}
