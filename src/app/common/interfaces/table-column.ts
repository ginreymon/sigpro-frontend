export interface TableColumn<T> {
  field?: keyof T;
  label: string;
  hidden?: boolean;
  align?: 'left' | 'center' | 'right';
  type?: 'text' | 'date' | 'boolean' | 'number' | 'tableActionType' | 'template' | 'index';
  order?: number;
  classes?: string;
  templateName?: string;
  footerSuffix?: string;
  footerFormat?: string;
  mobileSecondary?: boolean;
}
