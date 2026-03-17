export interface Option {
  id: number;
  name: string;
  order: number;
  creation_date?: Date;
  update_date?: Date;
  url: string | null;
  state: boolean;
  module_id: number;
  title: string | null;
  description: string | null;
  visible: boolean;
}
