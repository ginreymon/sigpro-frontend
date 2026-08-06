import { AuditInfo } from './audit-info';
import { BaseDocument } from './base-document';
import { BaseProduct } from './base-product';
import { ProductClassification } from './product-classification';
import { OperationCenter } from './operation-center';
import { SkuDetail } from './sku-detail';
import { Totals } from './totals';

export interface ProductionItem
  extends BaseDocument, BaseProduct, AuditInfo, Partial<SkuDetail> {
  color: string;
  operationCenters: OperationCenter[];
  totals: Totals;
  classification: ProductClassification;
}
