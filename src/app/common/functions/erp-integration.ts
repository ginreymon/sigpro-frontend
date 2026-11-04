import { WorkCenterDocument } from '../../models/integration/order-by-work-center';

type ErpDocument = Pick<
  WorkCenterDocument,
  'erp_completed_operation' | 'erp_execution_quantity' | 'erp_completed_quantity'
>;

// ERP operation state as sent by the API (0 / 1 / true / false, sometimes as text). Shared by every area.
export function isErpOperationCompleted(value: unknown): boolean {
  return value === true || value === 1 || value === '1' || value === 'true';
}

// Most that can be integrated in an OP: what the ERP still has to execute
// (erp_execution_quantity - erp_completed_quantity). `fallback` (the area's own pending total) applies only
// when the ERP sends no quantities.
export function erpIntegrableMax(document: ErpDocument, fallback: number): number {
  const { erp_execution_quantity: execution, erp_completed_quantity: completed } = document;
  return execution == null || completed == null ? fallback : Math.max(0, Math.floor(Number(execution) - Number(completed)));
}

// ERP rule, the same one the backend enforces for every area: an OP can be integrated only while its ERP
// operation is not completed and erp_completed_quantity + units <= erp_execution_quantity.
// Returns why the OP cannot be integrated, or null when it can.
export function erpBlockReason(document: ErpDocument, units: number): string | null {
  if (isErpOperationCompleted(document.erp_completed_operation)) {
    return 'la operación ya está completada en el ERP';
  }
  const { erp_completed_quantity: completed, erp_execution_quantity: execution } = document;
  if (completed != null && execution != null && Number(completed) + units > Number(execution)) {
    return `la cantidad supera lo disponible en el ERP (máximo ${erpIntegrableMax(document, 0)})`;
  }
  return null;
}
