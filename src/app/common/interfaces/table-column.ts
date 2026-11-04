export interface TableColumn<T> {
  field?: keyof T;
  label: string;
  hidden?: boolean;
  align?: 'left' | 'center' | 'right';
  type?: 'text' | 'date' | 'boolean' | 'number' | 'tableActionType' | 'template' | 'index';
  order?: number;
  classes?: string;
  templateName?: string;
  // Makes the column filterable by a computed (display) value, e.g. for template columns without a field.
  filterValue?: (row: T) => any;
  footerSuffix?: string;
  footerFormat?: string;
  mobileSecondary?: boolean;
}
