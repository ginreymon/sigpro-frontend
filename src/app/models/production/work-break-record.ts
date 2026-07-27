import { AuditEntity } from '../../common/interfaces/audit-entity';

export interface WorkBreakRecord extends AuditEntity {
  session: number;
  work_break?: number | null;
  custom_reason?: string | null;
  start_time: string;
  end_time?: string | null;
  resumed_at?: string | null;
  duration_seconds?: number;
  name?: string;
  work_session_activity?: Number;
}

export type PausePayload =
  | { work_break: number }
  | { custom_reason: string; work_break_minutes?: number };