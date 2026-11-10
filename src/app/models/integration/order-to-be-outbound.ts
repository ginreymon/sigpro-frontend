import { BaseEntity } from '../../common/interfaces/base-entity';

// Approval table row: one `work_centers` item of
// sp_totales_registrados_por_op_json (apps/integration/orders-to-be-outbound/),
// with the length of its `detail` and the `detail` itself. `id` is sequential
// within the response (not a CRUD entity, it is a row of an aggregated report);
// it only exists to fit BaseEntity/DataTable.
// The columns must match the SP JSON.
export interface OrderToBeOutboundDetail {
  op_rowid: number;
  op_number: number;
  op_type: string;
  description: string | null;
  total_completed: number;
  total_scrap: number;
  total_rejected: number;
  total_recorded: number;
  total_records: number;
  pieces: number | null;
  operation_number: number | null;
  erp_completed_operation: boolean | null;
  erp_execution_quantity: number | null;
  erp_completed_quantity: number | null;
  recorded_quantity_per_piece: number | null;
  erp_quantity_discrepancy: number | null;
  // Net time of the OP in seconds (excluding breaks and module stoppages) and per
  // recorded unit. null for stamping or when the query has no date range.
  total_seconds: number | null;
  seconds_by_unit: number | null;
  // Ids of the grouped records (production/stamping record).
  register_ids: number[];
  // Reference of the OP's article (t120.f120_referencia / f120_rowid).
  reference: string | null;
  reference_rowid: number | null;
}

// Group status: Complete if all its OPs have the operation completed.
export const OPERATIONS_LABEL = { complete: 'Completa', difference: 'Diferencia' } as const;
export type OperationsStatus = (typeof OPERATIONS_LABEL)[keyof typeof OPERATIONS_LABEL];

export interface OrderToBeOutbound extends BaseEntity {
  // null when the query has no date range.
  day_number: number | null;
  record_date: string | null;

  code: string;
  description: string | null;
  work_center_id: number;
  origin: string;
  origin_id: number;
  core_module_id: number | null;
  first_start: string | null;
  last_end: string | null;

  detail_count: number;
  detail: OrderToBeOutboundDetail[];

  // Computed by the frontend on load; it does not come from the API.
  operations_status?: OperationsStatus;
}
