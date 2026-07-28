import { TimeAuditEntity } from '../../common/interfaces/time-audit-entity';
import { UserAuditEntity } from '../../common/interfaces/user-audit-entity';
import { ActiveEntity } from '../../common/interfaces/active-entity';

export interface AdditionalStampingTimeStep {
  description: string;
  standard_time?: string | null;
}

export interface AdditionalStampingTime extends TimeAuditEntity, UserAuditEntity, ActiveEntity {
  code_number: string;
  engineering_code: string;
  machine?: number | null;
  machine_name?: string | null;
  machine_type: number;
  machine_type_name?: string | null;
  process: string;
  steps?: AdditionalStampingTimeStep[] | null;
  standard_time?: string | null;
}
