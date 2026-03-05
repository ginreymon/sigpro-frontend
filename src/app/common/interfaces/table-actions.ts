export type TableActionType = 'edit' | 'delete' | 'view' | 'create';

export interface TableActionConfig {
  enabled?: boolean;
  title?: string;
}

export type TableActions = Record<TableActionType, TableActionConfig>;
