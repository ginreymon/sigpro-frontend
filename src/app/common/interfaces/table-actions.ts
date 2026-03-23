export type TableActionType = 'edit' | 'delete' | 'view' | 'create';

export interface TableActionConfig {
  enabled: boolean;
  title?: string;
  iconName?: string;
  toolTip?: string;
}

export type TableActions = Record<TableActionType, TableActionConfig>;
