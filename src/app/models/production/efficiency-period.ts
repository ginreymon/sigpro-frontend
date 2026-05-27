export interface EfficiencyPeriod {
  period_start: string;
  period_end: string;
  shift_id: number;
  module_id: number;
  avg_employee_count: number;
  total_records: number;
  total_ordered: number;
  total_planned: number;
  total_completed: number;
  total_scrap: number;
  total_rejected: number;
  total_sam_earned: number;
  total_productive_seconds: number;
  total_break_seconds: number;
  total_activity_seconds: number;
  first_record_start: string;
  last_record_end: string;
  elapsed_shift_seconds: number;
  total_available_seconds: number;
  interval_target: number;
  unit_target: number;
  total_produced: number;
  weighted_avg_sam: number;
  efficiency: number;
}
