import { TimeAuditEntity } from '../../common/interfaces/time-audit-entity';
import { UserAuditEntity } from '../../common/interfaces/user-audit-entity';
import { ActiveEntity } from '../../common/interfaces/active-entity';

export interface StampingProcess extends TimeAuditEntity, UserAuditEntity, ActiveEntity {
  name: string;
  machine?: number | null;
  machine_name?: string | null;
}
