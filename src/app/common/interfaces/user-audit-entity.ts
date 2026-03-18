import { BaseEntity } from './base-entity';

export interface UserAuditEntity extends BaseEntity {
  created_by?: number;
  updated_by?: number;
  created_by_username?: string;
  updated_by_username?: string;
}
