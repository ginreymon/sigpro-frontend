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

  total_audited_quantity?: number;
  matches_total?: boolean;
  // Per-row: ordered_quantity === audited_quantity for this color — drives
  // the "Autorizado" (ready for production) column.
  quantities_match?: boolean;
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
