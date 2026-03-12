import { BaseEntity } from './base-entity';

export interface LocalBaseEntity extends BaseEntity {
  rowid: number;
  is_deleted: boolean;
  deleted_at: string | null;
}
