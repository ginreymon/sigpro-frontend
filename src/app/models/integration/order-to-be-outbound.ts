import { BaseEntity } from '../../common/interfaces/base-entity';

// Fila de sp_totales_registrados_por_op (apps/integration/orders-to-be-outbound/).
// Contrato en evolucion: se espera que el backend agregue mas columnas
// cuando se sume el flujo de aprobacion/rechazo (ver plan de la vista
// approval). `id` es sintetico (op_rowid * 10 + origin_id, ver serializer):
// no es una entidad CRUD, es una fila de un reporte agregado (una fila por
// OP + area de origen); solo existe para calzar con BaseEntity/DataTable.
export interface OrderToBeOutbound extends BaseEntity {
  op_rowid: number;
  op_number: number;
  op_type: string;
  origin: string;
  origin_id: number;
  ordered_quantity: number;
  planned_quantity: number;
  total_completed: number;
  total_scrap: number;
  total_rejected: number;
  total_recorded: number;
  pending_quantity: number;
  total_records: number;
  first_start: string | null;
  last_end: string | null;
}
