export interface ModuleEfficiencyStatus {
  module_id: number;
  number: number;
  name: string;
  location: string;
  module_enabled: boolean;

  work_shift_id: number;
  work_session_id: number;
  work_session_activity_id: number;
  start_time: string;
  work_shift_start_utc: string;
  started_at: string;
  ended_at?: string;
  operator_count?: number;

  is_active: number;
  is_pause: number;
  status: 'ACTIVE' | 'INACTIVE' | 'PAUSED' | 'DISABLED';

  period_start: string;
  period_end: string;
  shift_id: number;
  efficiency: number;

  total_ordered?: number;
  total_planned?: number;
  total_completed?: number;
  total_scrap?: number;
  total_rejected?: number;
  total_produced?: number;
  unit_target?: number;

  employees_snapshot?: number;
}
