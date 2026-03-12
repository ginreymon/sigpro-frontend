import { BaseEntity } from "./base-entity";

export interface TimeAuditEntity extends BaseEntity{
  created_at: string;
  updated_at: string;
}
