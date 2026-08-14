import { AuditEntity } from '../../common/interfaces/audit-entity';
import { Employee } from './employee';

export interface EmployeeContinuousWorkLimit extends AuditEntity {
  employee?: Employee | null;
  employee_id?: number | null;
  continuous_work_minutes: number;
  description?: string | null;
}
