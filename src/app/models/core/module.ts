import { Option } from './option';

export interface Module {
  id: number;
  name: string;
  order: number;
  creation_date?: Date;
  update_date?: Date;
  url: string | null;
  state: boolean;
  options?: Option[];
}
