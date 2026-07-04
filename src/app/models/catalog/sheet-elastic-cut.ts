import { AuditEntity } from '../../common/interfaces/audit-entity';
import { SheetElasticCutDetail } from './sheet-elastic-cut-detail';

export interface SheetElasticCut extends AuditEntity {
  sheet_id: number;
  measurement: string | null;
  order: number | null;
  details?: SheetElasticCutDetail[];
}
