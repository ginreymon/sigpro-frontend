export type TableToolsButtonType = 'filter' | 'columns' | 'export' | 'addItem';

export interface TableToolsButtonConfig {
  enabled?: boolean;  
}

export type TableToolsButtons = Record<TableToolsButtonType, TableToolsButtonConfig>;
