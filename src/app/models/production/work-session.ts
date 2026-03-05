export interface WorkSession {
  id: number;

  user: number;
  work_shift: number;

  started_at: string;
  ended_at?: string | null;

  total_time?: string | null;

  is_closed: boolean;

  created_at: string;
  updated_at: string;

  created_by?: number | null;
  updated_by?: number | null;
}
