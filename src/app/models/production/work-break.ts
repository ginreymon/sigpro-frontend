import { AuditEntity } from '../../common/interfaces/audit-entity';

export interface WorkBreak extends AuditEntity {
  name: string;
  description: string;
  duration: string; // DurationField
}
