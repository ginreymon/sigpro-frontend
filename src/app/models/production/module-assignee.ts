import { AuditEntity } from '../../common/interfaces/audit-entity';

export interface ModuleAssignee extends AuditEntity {
  module: number;
  employee: number;
}
