// One OP x reference row of the OP progress dashboard. Quantities are whole OP units
// for every area (the stamping factor is already applied in the database).
export interface OpProgressRow {
  area_id: number;
  area_name: string;
  module_id: number;
  module_name: string;
  module_number: number;
  op_type: string;
  op_number: number;
  // Null for closed OPs: the ERP no longer returns their header.
  reference_code: string | null;
  reference_description: string | null;
  total_qty: number | null;
  done_qty: number | null;
  // Negative when the OP was overproduced.
  pending_qty: number | null;
  // 0..100; null when there is not enough data to compute it.
  progress_pct: number | null;
}
