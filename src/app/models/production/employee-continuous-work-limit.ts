import { AuditEntity } from '../../common/interfaces/audit-entity';
import { Employee } from './employee';

export interface EmployeeContinuousWorkLimit extends AuditEntity {
  employee?: Employee | null;
  employee_id?: number | null;
  continuous_work_minutes: number;
  description?: string | null;
  // Full name del empleado, usado por ensureDisplayField para mostrar
  // el registro en el diálogo de confirmación al eliminar.
  name?: string;
}
