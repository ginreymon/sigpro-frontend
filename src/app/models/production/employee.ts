import { AuditEntity } from '../../common/interfaces/audit-entity';
import { Group } from '../user/group';

export interface Employee extends AuditEntity { 
  has_account: boolean;
  username: string | null;
  user_id: number | null;
  groups: Group[];
  is_account_active: boolean;
  first_name: string;
  last_name1: string;
  last_name2: string | null;
  id_number: string;
  company_name: string | null;
  contract_status: string | null;
  cost_center_rowid: number | null;
  cost_center_description: string | null;
  cost_group_id: string | null;
  cost_group_description: string | null;
  is_apprentice?: boolean;
  full_name?: string;
}
