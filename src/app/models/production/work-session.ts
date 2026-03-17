import { AuditEntity } from '../../common/interfaces/audit-entity';
import { Employee } from './employee';

export interface WorkSession extends AuditEntity {
  user: number;
  work_shift: number;
  started_at: string;
  ended_at?: string | null;
  total_time?: string | null;
  is_closed: boolean;
  module: number;
  employee_ids: number[];
  employees_snapshot?: Employee[];
}
