import { TimeAuditEntity } from '../../common/interfaces/time-audit-entity';
import { UserAuditEntity } from '../../common/interfaces/user-audit-entity';
import { ActiveEntity } from '../../common/interfaces/active-entity';

export interface ReferenceSam extends TimeAuditEntity, UserAuditEntity, ActiveEntity {
  rowid_item: number;
  sam: string;
  reference?: string | null;
  skus_count?: number;
}
