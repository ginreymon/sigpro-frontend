import { OpDailyItem, OpDailyRow } from '../../models/production/op-daily-item';

const uniqueSorted = (values: Iterable<string>): string[] =>
  [...new Set(values)].filter(Boolean).sort((a, b) => a.localeCompare(b, 'es-CO', { numeric: true }));

/**
 * Groups shift-summary rows by area + OP type + OP number.
 *
 * The same OP shows up once per module and SKU/reference, so completed quantities are summed
 * while the ordered quantity is taken once per SKU (max across modules) before summing.
 * Only OPs with registered production (completed > 0) are returned, most produced first.
 */
export function aggregateOpDaily(rows: OpDailyRow[]): OpDailyItem[] {
  const groups = new Map<string, OpDailyRow[]>();
  for (const row of rows) {
    const key = `${row.area}|${row.op_type}|${row.op_number}`;
    const group = groups.get(key);
    if (group) group.push(row);
    else groups.set(key, [row]);
  }

  const items: OpDailyItem[] = [];
  for (const [key, group] of groups) {
    const completedToday = group.reduce((sum, r) => sum + (r.total_completed ?? 0), 0);
    if (completedToday <= 0) continue;

    const orderedByItem = new Map<string, number>();
    for (const r of group) {
      if (r.total_ordered == null) continue;
      orderedByItem.set(r.item_key, Math.max(orderedByItem.get(r.item_key) ?? 0, r.total_ordered));
    }
    const ordered = orderedByItem.size ? [...orderedByItem.values()].reduce((a, b) => a + b, 0) : null;

    items.push({
      key,
      area: group[0].area,
      opNumber: group[0].op_number,
      opType: group[0].op_type,
      references: uniqueSorted(group.map((r) => r.reference)),
      modules: uniqueSorted(group.map((r) => r.module_name)),
      completedToday,
      ordered: ordered && ordered > 0 ? ordered : null,
    });
  }
  return items.sort((a, b) => b.completedToday - a.completedToday);
}
