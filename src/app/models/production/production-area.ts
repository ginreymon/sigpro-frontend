import { AuditEntity } from '../../common/interfaces/audit-entity';

export interface ProductionArea extends AuditEntity {
  name: string;
  description?: string | null;
}
