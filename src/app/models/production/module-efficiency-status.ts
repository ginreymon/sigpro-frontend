export interface ModuleEfficiencyStatus {
  module_id: number;
  core_module_id?: number | null;
  number: number;
  name: string;
  location: string;
  module_enabled: boolean;

  work_shift_id: number;
  work_session_id: number;
  work_session_activity_id: number;
  start_time: string;
  work_shift_start_utc: string;
  // Shift start in UTC as sent by the API (mapper renames work_shift_start_utc); shown in Colombia time (UTC-5).
  shift_start_utc?: string;
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
  minutos_instalados?: number;
  unit_target?: number;

  employees_snapshot?: number;

  machine_id?: number;
  machine_name?: string;
  machine_type?: string;

  last_worked_date?: string | null;
  last_worked_total_completed?: number | null;
  last_worked_efficiency?: number | null;
  last_worked_productivity?: number | null;
}
