import { AuditEntity } from '../../common/interfaces/audit-entity';

export interface SheetElasticCut extends AuditEntity {
  sheet_id: number;
  measurement: string | null;
  order: number | null;
}
