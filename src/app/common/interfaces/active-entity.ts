import { BaseEntity } from './base-entity';

export interface ActiveEntity extends BaseEntity {
  is_active: boolean;
}
