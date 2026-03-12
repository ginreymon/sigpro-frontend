import { BaseEntity } from "./base-entity";

export interface UserAuditEntity extends BaseEntity{
  created_by?: number | null;
  updated_by?: number | null;
}
