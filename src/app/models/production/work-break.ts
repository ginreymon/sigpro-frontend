export interface WorkBreak {
  id: number;

  name: string;
  description: string;
  duration: string; // DurationField

  created_at: string;
  updated_at: string;

  created_by?: number | null;
  updated_by?: number | null;

  is_active: boolean;
}
