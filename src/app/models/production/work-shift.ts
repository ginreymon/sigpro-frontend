import { AuditEntity } from '../../common/interfaces/audit-entity';
import { Module } from '../core/module';
import { ProductionArea } from './production-area';

export interface WorkShift extends AuditEntity {
  name: string;
  start_time: string; // HH:mm:ss
  end_time: string; // HH:mm:ss
  totalTime?: string;
  app_module?: number | null;
  app_module_detail?: Module | null;
  location_id?: number | null;
  location?: ProductionArea | null;
}
