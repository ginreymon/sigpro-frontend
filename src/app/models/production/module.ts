import { AuditEntity } from '../../common/interfaces/audit-entity';
import { Employee } from './employee';
import { WorkCenter } from './work-center';
import { ProductionArea } from './production-area';

export interface Module extends AuditEntity {
  name: string;
  number: number;

  operator_count: number;
  location_id?: number | null;
  location?: ProductionArea | null;

  work_center_id: number;
  work_center: WorkCenter;
  employees?: Employee[];

  machine?: { id: number; name: string; machine_type_id: number; uses_processes_search: boolean } | null;
  machine_id?: number | null;

  assigned_users?: { id: number; username: string }[];
  assigned_user_ids?: number[];
}
