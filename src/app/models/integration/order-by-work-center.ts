import { BaseEntity } from '../../common/interfaces/base-entity';
import { ColorRowDetail } from '../production/color-row-detail';
import { OrderToBeOutboundDetail } from './order-to-be-outbound';
import { SkuRecord } from '../production/sku-detail';

// Candidate SAM of a stamping OP inside `detail.referenceSams` (fn_detalle_estampacion_op_json),
// with its stamping records. snake_case like StampingReferenceSam; the TEP state keys are
// translated by the backend (Tep_Procesado -> tepProcessed, Records -> records).
export interface IntegrationReferenceSam {
  id: number;
  reference_code: string;
  task_people_count: number;
  machine_type: number;
  machine_type_name: string | null;
  sam: number;
  stamped_pieces: number;
  tasks_per_hour: number | null;
  stamped_qty: number;
  pending_qty: number;
  tepProcessed: boolean;
  records?: SkuRecord[];
}

// One `documents` item of sp_totales_registrados_por_op_work_center_json: the OP
// columns of the approval table, plus `detail` (only for origin_id = 1; null in
// the other origins, same colorRows shape as production-orders/detail) and with
// `additional_seconds_by_unit` (not calculated) instead of `total_seconds`.
export interface WorkCenterDocument extends Omit<OrderToBeOutboundDetail, 'total_seconds'> {
  additional_seconds_by_unit: number | null;
  // Confección (origin_id = 1): colorRows; Estampación (origin_id = 2): referenceSams; null in the rest.
  detail: {
    colorRows?: ColorRowDetail[];
    referenceSams?: IntegrationReferenceSam[];
    // Pieces to stamp per ordered unit (sum of stamped_pieces of the SAMs); null when no SAM qualifies.
    stamping_factor?: number | null;
  } | null;
}

// Row of apps/integration/orders-to-be-outbound/by-work-center/: one work center
// with its documents. `id` is sequential within the response (not a CRUD entity),
// it only exists to fit BaseEntity/DataTable.
export interface OrderByWorkCenter extends BaseEntity {
  code: string;
  description: string | null;
  work_center_id: number;
  origin: string;
  origin_id: number;
  core_module_id: number | null;
  first_start: string | null;
  last_end: string | null;

  documents_count: number;
  documents: WorkCenterDocument[];

  // Local date (dd/MM/yyyy) of `last_end`, computed by the frontend on load
  // (WorkCenterTotals.mapResponse); it does not come from the API. The column
  // filter works on it, so it lists days instead of every timestamp.
  end_date?: string;
}
