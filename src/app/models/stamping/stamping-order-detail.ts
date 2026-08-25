import { ProductionOrder } from '../production/production-order';
import { StampingReferenceSam } from './stamping-reference-sam';

// /stamping/stamping-orders/detail/ es un superset de
// /production/production-orders/detail/ (mismo op_production_service por
// debajo, con orderedQty/referenceSams de estampación encima) — extender
// ProductionOrder deja que este objeto se use en cualquier sitio que espere
// una ProductionOrder (ej. app-production-orders-table) sin castear.
export interface StampingOrderDetail extends ProductionOrder {
  orderedQty: number;
  referenceSams: StampingReferenceSam[];
}
