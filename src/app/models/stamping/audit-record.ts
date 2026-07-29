import { AuditEntity } from '../../common/interfaces/audit-entity';

export interface AuditRecord extends AuditEntity {
  op_number: number | null;
  op_rowid: number | null;
  op_type: string | null;

  color: string;
  sku_rowids: number[];
  ordered_quantity: number;
  audited_quantity: number;
  total_op_quantity: number;

  total_audited_quantity?: number;
  matches_total?: boolean;
}

export interface AuditRecordBulkPayload {
  op_number: number | null;
  op_rowid: number | null;
  op_type: string | null;
  total_op_quantity: number;
  colors: {
    color: string;
    sku_rowids: number[];
    ordered_quantity: number;
    audited_quantity: number;
  }[];
}
