import { AuditEntity } from '../../common/interfaces/audit-entity';

export interface SheetMeasurementDetail extends AuditEntity {
  sheet_measurement_id: number;
  size: string | null;
  value: string | null;
  unit: string | null;
}
