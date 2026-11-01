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
  // Text shown (and matched) by the column filter instead of the raw value, e.g. to filter a
  // timestamp by "dd/MM/yyyy HH:mm". Rows that share the same text count as one option.
  filterFormat?: (value: any) => string;
}
