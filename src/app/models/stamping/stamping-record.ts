import { AuditEntity } from '../../common/interfaces/audit-entity';

export interface StampingRecord extends AuditEntity {
  op_rowid: number;
  op_number: number;
  op_type: string;

  work_session_activity: number;
  stamping_reference_sam: number | null;

  ordered_quantity: number;
  completed_quantity: number;

  start_time: string;
  end_time: string | null;
}
