import { ModuleEfficiencyRow } from '../../models/production/module-efficiency-row';

export interface DailyPoint {
  date: string;
  value: number | null;
}

// Sum that is null when any value is missing (e.g. stamping scrap), so the UI shows
// "No disponible" instead of a misleading partial total or a 0.
function sumOrNull(values: (number | null | undefined)[]): number | null {
  if (!values.length || values.some((v) => v == null)) return null;
  return values.reduce<number>((sum, v) => sum + (v as number), 0);
}

function localDateKey(iso: string): string {
  const d = new Date(iso);
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${month}-${day}`;
}

function groupByDay(rows: ModuleEfficiencyRow[]): [string, ModuleEfficiencyRow[]][] {
  const byDay = new Map<string, ModuleEfficiencyRow[]>();
  for (const row of rows) {
    const key = localDateKey(row.shift_start_utc);
    byDay.set(key, [...(byDay.get(key) ?? []), row]);
  }
  return [...byDay.entries()].sort(([a], [b]) => a.localeCompare(b));
}

/**
 * Daily efficiency (local time), sorted by date. Same formula as the monthly figure on the
 * coordinator homes: mean of the row efficiencies above 0, rounded to 2 decimals; a day
 * without such rows is null. The backend returns one row per shift and module.
 */
export function aggregateDailyEfficiency(rows: ModuleEfficiencyRow[]): DailyPoint[] {
  return groupByDay(rows).map(([date, dayRows]) => {
    const withData = dayRows.filter((r) => (r.efficiency ?? 0) > 0);
    const avg = withData.length
      ? withData.reduce((sum, r) => sum + r.efficiency, 0) / withData.length
      : null;
    return { date, value: avg === null ? null : Math.round(avg * 100) / 100 };
  });
}

/**
 * Completed quantity per day (local time), sorted by date; a day with any missing value is
 * null. There is no hourly series in the backend.
 */
export function aggregateDailyCompleted(rows: ModuleEfficiencyRow[]): DailyPoint[] {
  return groupByDay(rows).map(([date, dayRows]) => ({
    date,
    value: sumOrNull(dayRows.map((r) => r.total_completed)),
  }));
}
