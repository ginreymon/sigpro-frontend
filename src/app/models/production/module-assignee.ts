import { Module } from './module';
import { AuditEntity } from '../../common/interfaces/audit-entity';

export interface ModuleAssignee extends AuditEntity {
  module: number;
  employee: number;
  module_detail: Module;
  module_name: string;
  employee_full_name: string;
  employee_id_number: string;
}
