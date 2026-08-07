import { StampingRecordContext } from './stamping-record-context';

export interface StampingProductivitySummaryRow {
  module_number: number;
  module_name: string;
  work_center_code: string;
  shift_name: string;
  shift_start_time: string;
  shift_end_time: string;
  shift_total_seconds: number;
  op_number: string;
  op_type: string;
  reference_identification: string;
  sam: number;
  tasks_per_hour: number;
  employee_count: number;
  total_ordered: number;
  total_completed: number;
  productivity_target: number;
  total_productive_seconds: number;
  total_break_seconds: number;
  total_activity_seconds: number;
  elapsed_shift_seconds: number;
  efficiency: number | null;
  first_record_start: string | null;
  last_record_end: string | null;
  records_detail?: StampingRecordContext[];
}
