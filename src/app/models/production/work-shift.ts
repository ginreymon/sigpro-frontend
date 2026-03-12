import { AuditEntity } from '../../common/interfaces/audit-entity';

export interface WorkShift extends AuditEntity {
  name: string;
  start_time: string; // HH:mm:ss
  end_time: string; // HH:mm:ss
  totalTime?: string;
}
