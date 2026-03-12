import { AuditEntity } from '../../common/interfaces/audit-entity';

export interface WorkCenter extends AuditEntity {
  is_deleted: boolean;
  code: string;
  description: string;
  short_description: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}
