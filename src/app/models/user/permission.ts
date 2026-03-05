export interface Permission {
  id: number;
  app_label: string;
  model: string;
  name: string;
  codename: string;
  content_type: number;
}
