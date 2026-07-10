import { AuditEntity } from '../../common/interfaces/audit-entity';
import { ProductionArea } from './production-area';

export interface WorkShift extends AuditEntity {
  name: string;
  start_time: string; // HH:mm:ss
  end_time: string; // HH:mm:ss
  totalTime?: string;
  location_id?: number | null;
  location?: ProductionArea | null;
}
