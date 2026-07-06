import { Option } from './option';

export interface Module {
  id: number;
  name: string;
  order: number;
  creation_date?: Date;
  update_date?: Date;
  url: string | null;
  state: boolean;
  has_shifts: boolean;
  options?: Option[];
}
