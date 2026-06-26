import { AuditEntity } from '../../common/interfaces/audit-entity';

export interface SheetMeasurement extends AuditEntity {
  sheet_id: number;
  measurement: string | null;
  tolerance: string | null;
  order: number | null;
}
