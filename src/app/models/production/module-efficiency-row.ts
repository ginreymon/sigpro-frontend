export interface ModuleEfficiencyRow {
  module_id: number;
  module_name: string;
  module_number: number;
  module_operator_count: number;
  module_location: string;
  work_center_id: number;
  work_center_code: string;
  work_center_name: string;
  work_shift_id: number;
  ended_at: string | null;
  shift_start_utc: string;
  total_registers: number;
  period_start: string;
  period_end: string;
  shift_id: number;
  total_ordered: number | null;
  total_planned: number | null;
  total_completed: number | null;
  total_scrap: number | null;
  total_rejected: number | null;
  total_produced: number | null;
  unit_target: number | null;
  minutos_producidos?: number | null;
  efficiency: number;
}
