import { BaseEntity } from '../../common/interfaces/base-entity';

// Fila de la tabla de aprobacion: un item de `work_centers` de
// sp_totales_registrados_por_op_json (apps/integration/orders-to-be-outbound/),
// con el largo de su `detail` y el `detail` mismo. `id` es secuencial dentro de
// la respuesta (no es una entidad CRUD, es una fila de un reporte agregado);
// solo existe para calzar con BaseEntity/DataTable.
// Las columnas deben coincidir con el JSON del SP.
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
  completed_operation: number | null;
  erp_planned_quantity: number | null;
  erp_ordered_quantity: number | null;
  erp_completed_quantity: number | null;
  recorded_quantity_per_piece: number | null;
  erp_quantity_difference: number | null;
  // Ids de los registros agrupados (production/stamping record).
  register_ids: number[];
  // Referencia del artículo de la OP (t120.f120_referencia / f120_rowid).
  reference: string | null;
  reference_rowid: number | null;
}

// Estado del grupo: Completa si todas sus OP tienen la operación completa.
export const OPERATIONS_LABEL = { complete: 'Completa', difference: 'Diferencia' } as const;
export type OperationsStatus = (typeof OPERATIONS_LABEL)[keyof typeof OPERATIONS_LABEL];

export interface OrderToBeOutbound extends BaseEntity {
  // null cuando la consulta no trae rango de fechas.
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

  // Lo calcula el frontend al cargar (ManualIntegration.mapResponse); no viene del API.
  operations_status?: OperationsStatus;
}
