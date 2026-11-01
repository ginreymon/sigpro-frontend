import { AuditEntity } from '../../common/interfaces/audit-entity';

export interface ModuleDowntime extends AuditEntity {
  module: number;
  work_break?: number | null;
  production_record?: number | null;
  stamping_record?: number | null;
  name?: string | null;
  custom_reason?: string | null;
  start_time: string;
  end_time?: string | null;
  resumed_at?: string | null;
}
