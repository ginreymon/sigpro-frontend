import { TableColumn } from '../../../../common/interfaces/table-column';
import { TableActions } from '../../../../common/interfaces/table-actions';

export function buildTableColumns<T>(
  originalColumns: TableColumn<T>[],
  actions: TableActions,
): TableColumn<T>[] {
  const columns: TableColumn<T>[] = [{ type: 'index', label: '' }, ...originalColumns];

  if (actions.delete.enabled || actions.edit.enabled || actions.view.enabled) {
    columns.push({ type: 'tableActionType', label: '' });
  }

  return columns.map((col, i) => ({
    ...col,
    align: col.align ?? (i == columns.length - 1 ? 'right' : 'left'),
    hidden: col.hidden ?? false,
    order: col.order ?? i,
    classes: col.classes ?? '',
  }));
}

export function getPrimaryColumn<T>(columns: TableColumn<T>[]): TableColumn<T> | undefined {
  return columns.find(
    (c) => !c.hidden && c.field && c.type !== 'tableActionType' && c.type !== 'index',
  );
}

export function getMobileActionsColumn<T>(columns: TableColumn<T>[]): TableColumn<T> | undefined {
  return columns.find((c) => !c.hidden && c.type === 'tableActionType');
}

function getLastFieldColumn<T>(
  columns: TableColumn<T>[],
  primary: TableColumn<T> | undefined,
): TableColumn<T> | undefined {
  const explicit = columns.find((c) => !c.hidden && c.mobileSecondary && c !== primary);
  if (explicit) return explicit;

  const candidates = columns.filter(
    (c) => !c.hidden && c.field && c.type !== 'tableActionType' && c.type !== 'index' && c !== primary,
  );
  return candidates.at(-1);
}

export function getMobileSecondaryColumn<T>(columns: TableColumn<T>[]): TableColumn<T> | undefined {
  if (getMobileActionsColumn(columns)) return undefined;
  return getLastFieldColumn(columns, getPrimaryColumn(columns));
}

export function getDetailColumns<T>(columns: TableColumn<T>[]): TableColumn<T>[] {
  const primary = getPrimaryColumn(columns);
  const secondary = getMobileSecondaryColumn(columns);
  return columns.filter(
    (c) => !c.hidden && c.type !== 'index' && c.type !== 'tableActionType' && c !== primary && c !== secondary,
  );
}

// Footer rows have no actions, so the secondary/detail split ignores mobileActionsColumn.
export function getFooterSecondaryColumn<T>(columns: TableColumn<T>[]): TableColumn<T> | undefined {
  return getLastFieldColumn(columns, getPrimaryColumn(columns));
}

export function getFooterDetailColumns<T>(columns: TableColumn<T>[]): TableColumn<T>[] {
  const primary = getPrimaryColumn(columns);
  const secondary = getFooterSecondaryColumn(columns);
  return columns.filter(
    (c) => !c.hidden && c.type !== 'index' && c.type !== 'tableActionType' && c !== primary && c !== secondary,
  );
}
