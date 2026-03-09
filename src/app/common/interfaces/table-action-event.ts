import { TableActionConfig, TableActionType } from './table-actions';

export interface TableActionEvent<T> {
  obj: T;
  type: TableActionType;
  action: TableActionConfig;
}
