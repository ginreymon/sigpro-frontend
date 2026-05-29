import { AuditEntity } from '../../common/interfaces/audit-entity';
import { Employee } from './employee';
import { ProductionRecord } from './production-record';
import { WorkBreakRecord } from './work-break-record';

export interface WorkSessionActivity extends AuditEntity {
  module: number;
  work_session: number;
  started_at: string;
  ended_at: string | null;
  is_active: boolean;
  employees_snapshot: Employee[];
  total_time_minutes: number | null;
  last_open_production_record?: ProductionRecord;
  last_production_record?: ProductionRecord;
  is_paused: boolean;
  active_time_seconds: number;
  total_pause_time_seconds: number;
  active_break?: WorkBreakRecord | null;
}
