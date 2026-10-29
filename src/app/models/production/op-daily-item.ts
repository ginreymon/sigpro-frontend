// One shift-summary row: an OP worked in a module for a SKU/reference.
export interface OpDailyRow {
  area: string;
  op_type: string;
  op_number: number;
  module_name: string;
  reference: string;
  // Identifies the SKU/reference line, so its ordered quantity is counted once per OP.
  item_key: string;
  total_ordered: number | null;
  total_completed: number | null;
}

// An OP aggregated across modules and references for the period.
export interface OpDailyItem {
  key: string;
  area: string;
  opNumber: number;
  opType: string;
  references: string[];
  modules: string[];
  completedToday: number;
  ordered: number | null;
}
