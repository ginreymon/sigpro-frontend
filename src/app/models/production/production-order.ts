import { AuditInfo } from './audit-info';
import { BaseDocument } from './base-document';
import { BaseProduct } from './base-product';
import { ProductClassification } from './product-classification';
import { ColorRowDetail } from './color-row-detail';
import { OrderTraceabilityStampingAudit, OrderTraceabilityTracking } from '../stamping/order-traceability';
import { StampingReferenceSam } from '../stamping/stamping-reference-sam';

export interface ProductionOrder extends BaseDocument, BaseProduct, AuditInfo {
  planId: string;
  sam?: number;
  docStatus?: number;
  docStatusName?: string;
  classification: ProductClassification;
  colorRows: ColorRowDetail[];
  stampingAudit?: OrderTraceabilityStampingAudit;
  tracking?: OrderTraceabilityTracking[];
  // Solo presente cuando la orden se resolvió vía stamping-orders/detail
  // (StampingOrderDetail) en vez de production-orders/detail.
  referenceSams?: StampingReferenceSam[];
}
