import { AuditEntity } from '../../common/interfaces/audit-entity';

export interface AuditRecord extends AuditEntity {
  op_number: number | null;
  op_rowid: number | null;
  op_type: string | null;

  color: string;
  sku_rowids: number[];
  ordered_quantity: number;
  audited_quantity: number;
  total_ordered_quantity: number;
  is_audited: boolean;

  total_audited_quantity?: number;
  matches_total?: boolean;
  // Per-row: ordered_quantity === audited_quantity for this color — drives
  // the "Autorizado" (ready for production) column.
  quantities_match?: boolean;
}

// One row per audited OP (not per color) — feeds the global "audited OPs"
// list in the "Auditoría" tab.
export interface AuditedOpSummary extends AuditEntity {
  op_number: number | null;
  op_rowid: number | null;
  op_type: string | null;
  total_ordered_quantity: number;
  total_audited_quantity: number;
  matches_total: boolean;
  is_audited: boolean;
  // Cutting (CR001) progress from the backend; null when the OP has no cut
  // traceability (no CR001 operation or not in a valid production state).
  cut_completed: boolean | null;
  cut_tracking: CutTracking | null;
}

export interface CutTracking {
  qty_to_execute: number | null;
  qty_completed: number | null;
  is_completed: boolean | null;
  operation: string | null;
}

// Lightweight audit status for a single OP (docType/docNumber) — no per-color
// detail, just enough to know if it's already audited when searching an OP.
export interface AuditStatus {
  exists: boolean;
  is_audited: boolean;
  total_ordered_quantity: number | null;
  total_audited_quantity: number | null;
  matches_total: boolean | null;
}

export interface AuditRecordBulkPayload {
  op_number: number | null;
  op_rowid: number | null;
  op_type: string | null;
  total_ordered_quantity: number;
  colors: {
    color: string;
    sku_rowids: number[];
    ordered_quantity: number;
    audited_quantity: number;
  }[];
}
