import { AuditEntity } from '../../common/interfaces/audit-entity';

export interface WorkBreakRecord extends AuditEntity {
  session: number;
  work_break?: number | null;
  custom_reason?: string | null;
  start_time: string;
  end_time?: string | null;
}
