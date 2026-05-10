import { AuditEntity } from '../../common/interfaces/audit-entity';

export interface WorkBreakRecord extends AuditEntity {
  session: number;
  work_break?: number | null;
  custom_reason?: string | null;
  start_time: string;
  end_time?: string | null;
}

export interface PauseResponse {
  work_break_record: WorkBreakRecord;
  server_now: string;
  server_end_pause: string;
}

export type PausePayload = | { work_break: number } | { custom_reason: string };