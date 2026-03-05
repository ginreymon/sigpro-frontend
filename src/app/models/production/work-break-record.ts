export interface WorkBreakRecord {
  id: number;

  session: number;
  work_break?: number | null;

  custom_reason?: string | null;

  start_time: string;
  end_time?: string | null;

  created_at: string;
  updated_at: string;

  created_by?: number | null;
  updated_by?: number | null;
}
