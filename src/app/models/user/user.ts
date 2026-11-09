import { Employee } from '../production/employee';
import { Group } from './group';

export interface User {
  id: number;
  username: string;
  email?: string;
  is_active: boolean;
  employee: Employee | null;
  groups: Group[];
  group_id: number;
  employee_local_id?: number | null;
  password?: string;
}
