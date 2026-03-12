import { LocalBaseEntity } from './local-base-entity';
import { TimeAuditEntity } from './time-audit-entity';
import { UserAuditEntity } from './user-audit-entity';
import { ActiveEntity } from './active-entity';

export interface AuditEntity
  extends LocalBaseEntity, TimeAuditEntity, UserAuditEntity, ActiveEntity {}
