export interface WorkCenter {
  id: number;

  rowid: number;
  is_deleted: boolean;

  code: string;
  description: string;
  short_description: string;

  created_at: string;
  updated_at: string;

  is_active: boolean;
}
