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
  // Only present when the order was resolved via stamping-orders/detail
  // (StampingOrderDetail) instead of production-orders/detail.
  referenceSams?: StampingReferenceSam[];
  orderedQty?: number;
  // Only present when the order was resolved via production-orders/processes:
  // true if the backend generated itemId in colorRows[].items.
  hasItemId?: boolean;
}
