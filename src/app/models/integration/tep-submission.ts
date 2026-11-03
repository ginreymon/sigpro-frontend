import { TimeAuditEntity } from '../../common/interfaces/time-audit-entity';
import { UserAuditEntity } from '../../common/interfaces/user-audit-entity';

// Envío hecho por POST integration/tep/send/ (ver TepSubmission en el backend).
export type TepSubmissionStatus = 'pending' | 'sent' | 'failed';

export interface TepSubmissionDetail {
  id: number;
  record_number: number;
  op_document_type_id: string;
  op_document_number: number;
  operation_number: number;
  operation_work_center_id: string;
  operation_completed: 0 | 1;
  completed_quantity: string;
  hours: string;
  // Time traceability (null on submissions made before it was tracked).
  time_mode: 'real' | 'standard' | null;
  sent_seconds_per_unit: string | null;
  real_seconds_by_unit: string | null;
  // 1 = producción, 2 = estampación.
  origin_id: number | null;
  register_ids: number[];
}

// Mensaje de error devuelto por SIESA (una fila del dataset de WSUNOEE).
export interface SiesaMessage {
  line: number | null;
  record_type: string | null;
  value: string | null;
  detail: string | null;
}

export interface TepSubmission extends TimeAuditEntity, UserAuditEntity {
  company_id: number;
  operation_center_id: string;
  document_type_id: string;
  document_number: number;
  date: string;
  work_center_id: string;
  status: TepSubmissionStatus;
  status_display: string;
  error_type: number | null;
  error_detail: string | null;
  siesa_messages: SiesaMessage[];
  sent_at: string | null;
  details: TepSubmissionDetail[];
}
