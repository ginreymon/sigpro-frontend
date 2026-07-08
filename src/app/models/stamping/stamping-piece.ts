import { TimeAuditEntity } from '../../common/interfaces/time-audit-entity';
import { UserAuditEntity } from '../../common/interfaces/user-audit-entity';
import { ActiveEntity } from '../../common/interfaces/active-entity';

export interface StampingPiece extends TimeAuditEntity, UserAuditEntity, ActiveEntity {
  name: string;
}
