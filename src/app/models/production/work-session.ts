import { AuditEntity } from '../../common/interfaces/audit-entity';

export interface WorkSession extends AuditEntity {
  user: number;
  work_shift: number;
  started_at: string;
  ended_at?: string | null;
  total_time?: string | null;
  is_closed: boolean;
}
