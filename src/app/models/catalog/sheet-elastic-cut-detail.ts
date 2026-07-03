import { AuditEntity } from '../../common/interfaces/audit-entity';

export interface SheetElasticCutDetail extends AuditEntity {
  sheet_elastic_cut_id: number;
  size: string | null;
  value: string | null;
  unit: string | null;
}
