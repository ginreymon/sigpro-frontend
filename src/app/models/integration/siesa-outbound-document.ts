import { TimeAuditEntity } from '../../common/interfaces/time-audit-entity';

export type SiesaOutboundDocumentStatus = 'pending' | 'sending' | 'sent' | 'failed' | 'poisoned';

export interface SiesaOutboundDocument extends TimeAuditEntity {
  document_type: string;
  idempotency_key: string;
  flat_file_line_count: number;
  op_rowid: number | null;
  op_number: number | null;
  work_center_code: string | null;
  work_center_rowid: number | null;
  location_id: number | null;
  status: SiesaOutboundDocumentStatus;
  status_display: string;
  attempts: number;
  next_retry_at: string | null;
  error_type: number | null;
  error_detail: string | null;
  sent_at: string | null;
}
