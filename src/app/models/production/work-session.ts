import { AuditEntity } from '../../common/interfaces/audit-entity';
import { Employee } from './employee';
import { Module } from './module';
import { WorkShift } from './work-shift';

export interface WorkSession extends AuditEntity {
  user: number;
  work_shift?: WorkShift;
  started_at: string;
  ended_at?: string | null;
  total_time?: string | null;
  is_closed: boolean;
  module?: Module;
  employee_ids: number[];
  employees_snapshot?: Employee[];
  work_shift_id: number;
  module_id: number;
}
