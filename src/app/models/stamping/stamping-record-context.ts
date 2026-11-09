export interface StampingRecordContext {
  record_id: number;
  record_start: string;
  record_end: string | null;
  record_seconds: number | null;
  ordered_quantity: number;
  completed_quantity: number;
  employee_count: number;
  employee_head_count: number;
  break_count: number;
  break_seconds: number;
  additional_time_minutes: number;

  activity_id: number;
  activity_started: string;
  activity_ended: string | null;

  session_id: number;
  session_started: string;
  session_ended: string | null;
  session_is_closed: boolean;
  session_editing_finalized: boolean;
  session_user_id: number;

  reference_sam_id: number;
  reference_rowid_item: number;
  reference_identification: string;
  reference_people_count: number;
  sam: number;
  tasks_per_hour: number;

  op_rowid: number;
  op_number: number;
  op_type: string;

  shift_id: number;
  shift_name: string;
  shift_start_time: string;
  shift_end_time: string;

  module_id: number;
  module_number: number;
  module_name: string;
  module_location: string;
  module_operator_count: number;

  work_center_id: number;
  work_center_rowid: number;
  work_center_code: string;
  work_center_name: string;
}
