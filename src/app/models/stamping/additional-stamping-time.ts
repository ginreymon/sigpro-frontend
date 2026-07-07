import { TimeAuditEntity } from '../../common/interfaces/time-audit-entity';
import { UserAuditEntity } from '../../common/interfaces/user-audit-entity';
import { ActiveEntity } from '../../common/interfaces/active-entity';

export interface AdditionalStampingTime extends TimeAuditEntity, UserAuditEntity, ActiveEntity {
  code_number: string;
  engineering_code: string;
  machine: string;
  process: string;
  process_description?: string[] | null;
  standard_time?: string | null;
}
