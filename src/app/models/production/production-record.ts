export interface ProductionRecord {
  id: number;

  sku_rowid: number;

  session: number;
  module: number;
  work_center: number;

  ordered_quantity: number;
  planned_quantity: number;
  completed_quantity: number;
  scrap_quantity: number;
  rejected_quantity: number;

  start_time: string; // HH:mm:ss
  end_time: string;   // HH:mm:ss

  created_at: string;
  updated_at: string;

  created_by?: number | null;
  updated_by?: number | null;
}
