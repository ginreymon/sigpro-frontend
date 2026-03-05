export interface WorkShift {
  id: number;

  name: string;
  start_time: string; // HH:mm:ss
  end_time: string;   // HH:mm:ss

  created_at: string;
  updated_at: string;

  created_by?: number | null;
  updated_by?: number | null;

  is_active: boolean;
}
