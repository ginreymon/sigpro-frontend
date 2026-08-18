import { AuditInfo } from './audit-info';
import { BaseDocument } from './base-document';
import { BaseProduct } from './base-product';
import { ProductClassification } from './product-classification';
import { ColorRowDetail } from './color-row-detail';
import { OrderTraceabilityStampingAudit, OrderTraceabilityTracking } from '../stamping/order-traceability';

export interface ProductionOrder extends BaseDocument, BaseProduct, AuditInfo {
  planId: string;
  sam?: number;
  docStatus?: number;
  docStatusName?: string;
  classification: ProductClassification;
  colorRows: ColorRowDetail[];
  stampingAudit?: OrderTraceabilityStampingAudit;
  tracking?: OrderTraceabilityTracking[];
}
