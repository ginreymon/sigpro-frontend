export interface ModuleAssignee {
  id: number;

  module: number;
  employee: number;

  created_at: string;
  updated_at: string;

  created_by?: number | null;
  updated_by?: number | null;
}
