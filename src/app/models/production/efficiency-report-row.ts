export interface BreakRecord {
  id: number;
  name: string;
  description: string | null;
  custom_reason: string | null;
  start_time: string;
  end_time: string | null;
  resumed_at: string | null;
  duration_seconds: number;
  duration_minutes: number;
}

export interface EfficiencyReportRow {
  shift_start_utc:    string;
  ended_at:           string;
  total_registers:    number;

  module_id:          number;
  module_number:      number;
  module_name:        string;

  work_shift_id:      number;
  shift_name:         string;
  shift_start_time:   string;
  shift_end_time:     string;

  employee_id:        number | null;
  employee_id_number: string | null;
  employee_first_name:string | null;
  employee_last_name1:string | null;
  employee_last_name2:string | null;
  employee_name:      string | null;

  total_ordered:      number;
  total_planned:      number;
  total_completed:    number;
  total_scrap:        number;
  total_rejected:     number;
  total_produced:     number;
  unit_target:        number;
  efficiency:         number;

  total_break_minutes:number;
  pause_count:        number;
  breaks:             BreakRecord[];

  /** Time-weighted effective employees (decimal), as used in the efficiency calculation. */
  equivalent_employees: number;
  employees:          any[];
}
