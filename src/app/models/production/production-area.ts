import { AuditEntity } from '../../common/interfaces/audit-entity';
import { Module } from '../core/module';

export interface ProductionArea extends AuditEntity {
  name: string;
  description?: string | null;
  core_module_id?: number | null;
  core_module?: Module | null;
}
