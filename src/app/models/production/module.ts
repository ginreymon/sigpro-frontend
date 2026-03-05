export interface Module {
  id: number;

  name: string;
  number: number;
  operator_count: number;
  location: string;

  created_at: string;
  updated_at: string;

  created_by?: number | null;
  updated_by?: number | null;

  is_active: boolean;
}
