import { Group } from '../user/group';

export interface Employee {
  id: number;
  has_account: boolean;
  username: string | null;
  user_id: number | null;
  groups: Group[];
  is_account_active: boolean;

  created_at: string;
  updated_at: string;

  is_active: boolean;
  is_deleted: boolean;
  deleted_at: string | null;

  rowid: number;

  first_name: string;
  last_name1: string;
  last_name2: string | null;
  id_number: string;
}
