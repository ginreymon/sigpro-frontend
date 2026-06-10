import { AuditEntity } from '../../common/interfaces/audit-entity';
import { Employee } from './employee';
import { Module } from './module';
import { WorkSessionActivity } from './work-session-activity';
import { WorkShift } from './work-shift';

export interface EmployeeSnapshot extends Employee { 
  is_apprentice: boolean;
}

export interface WorkSession extends AuditEntity {
  user: number;
  work_shift: WorkShift;
  started_at: string;
  ended_at: string | null;
  total_time: string | null;
  is_closed: boolean;
  editing_finalized: boolean;
  current_module?: Module;
  modules: Module[];
  employees_snapshot?: EmployeeSnapshot[];
  work_shift_id: number;
  module_id: number;
  active_activity: WorkSessionActivity;
}
