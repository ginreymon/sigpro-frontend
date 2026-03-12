import { AuditEntity } from '../../common/interfaces/audit-entity';
import { WorkCenter } from './work-center';

export interface Module extends AuditEntity {
  name: string;
  number: number;

  operator_count: number;
  location: string;

  work_center_id: number;
  work_center: WorkCenter;
}
