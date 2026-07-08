import { TimeAuditEntity } from '../../common/interfaces/time-audit-entity';
import { UserAuditEntity } from '../../common/interfaces/user-audit-entity';
import { ActiveEntity } from '../../common/interfaces/active-entity';

export interface StampingMachine extends TimeAuditEntity, UserAuditEntity, ActiveEntity {
  name: string;
  machine_type: number;
  machine_type_name?: string | null;
}
