// Nested records come straight from the SQL JSON (dbo.sp_sesiones_trabajo_op_json); only the
// keys the screen reads are typed, the rest stays open on purpose.
export interface ExplorerRecord {
  id: number;
  op_type: string;
  op_number: number;
  start_time: string;
  end_time: string | null;
  tep_processed: boolean;
  [key: string]: any;
}

export interface ExplorerActivity {
  session_activity_id: number;
  started_at: string;
  ended_at: string | null;
  is_active: boolean;
  module: { id: number; name: string; number: number } | null;
  production_records: ExplorerRecord[] | null;
  stamping_records: ExplorerRecord[] | null;
  employees: { id: number; first_name: string; last_name1: string; last_name2: string | null }[] | null;
  work_shift_snapshots: { id: number; start_time: string; end_time: string }[] | null;
  unproductive_times: {
    breaks: { id: number; name: string | null; start_time: string; end_time: string | null }[] | null;
    downtimes: { id: number; name: string | null; start_time: string; end_time: string | null }[] | null;
  } | null;
}

export interface WorkSessionExplorerRow {
  id: number;
  started_at: string;
  ended_at: string | null;
  is_closed: boolean;
  area_name: string | null;
  module_name: string | null;
  op_type: string | null;
  op_number: number | null;
  reference: string | null;
  // Added by the explorer page: "type number", so one column can show and filter both.
  op?: string;
  // Added by the explorer page: production + stamping records and breaks + downtimes of all activities.
  records_count?: number;
  breaks_count?: number;
  session_activities: ExplorerActivity[] | null;
}
