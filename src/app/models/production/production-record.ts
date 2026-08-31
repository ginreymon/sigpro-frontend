import { AuditEntity } from '../../common/interfaces/audit-entity';

export interface ProductionRecord extends AuditEntity {
  sku_rowid: number;

  op_rowid: number;
  op_number: number;
  op_type: string;

  work_session_activity: number;

  ordered_quantity: number;
  planned_quantity: number;
  completed_quantity: number;
  scrap_quantity: number;
  rejected_quantity: number;

  start_time: string;
  server_now: string;
  end_time: string | null;
  net_duration: string | null;
  is_paused?: boolean;

  // Solo para el registro manual de duración (POST .../manual-duration/):
  // el backend calcula start_time/end_time a partir de esto, no se persiste tal cual.
  duration_seconds?: number;
}
