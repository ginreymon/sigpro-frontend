import { Option } from '../core/option';
import { Group } from './group';
import { Permission } from './permission';

export interface Role extends Group {
  permissions: Permission[];
  option_ids: number[];
  options: Option[];
}
