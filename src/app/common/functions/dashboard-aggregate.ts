import { ModuleEfficiencyRow } from '../../models/production/module-efficiency-row';

export interface DailyPoint {
  date: string;
  value: number | null;
}

// Sum of the present values; null only when every value is missing, so a day is not erased by
// one module that reports no output (SQL returns NULL for an empty sum, i.e. 0 completed).
function sumOrNull(values: (number | null | undefined)[]): number | null {
  const present = values.filter((v): v is number => v != null);
  return present.length ? present.reduce((sum, v) => sum + v, 0) : null;
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
 * Completed quantity per day (local time), sorted by date; modules without output (null) add
 * nothing, and a day where every value is null is null. There is no hourly series in the backend.
 */
export function aggregateDailyCompleted(rows: ModuleEfficiencyRow[]): DailyPoint[] {
  return groupByDay(rows).map(([date, dayRows]) => ({
    date,
    value: sumOrNull(dayRows.map((r) => r.total_completed)),
  }));
}

export interface ModuleEfficiencyPoint {
  moduleId: number;
  label: string;
  value: number | null;
}

/**
 * Efficiency per module over the given rows, sorted by module number. Same rule as the daily
 * and monthly figures: mean of the row efficiencies above 0, rounded to 2 decimals; a module
 * without such rows is null. The backend returns one row per shift and module.
 */
export function aggregateEfficiencyByModule(rows: ModuleEfficiencyRow[]): ModuleEfficiencyPoint[] {
  const byModule = new Map<number, ModuleEfficiencyRow[]>();
  for (const row of rows) {
    byModule.set(row.module_id, [...(byModule.get(row.module_id) ?? []), row]);
  }
  return [...byModule.entries()]
    .sort(([, a], [, b]) => a[0].module_number - b[0].module_number)
    .map(([moduleId, moduleRows]) => {
      const withData = moduleRows.filter((r) => (r.efficiency ?? 0) > 0);
      const avg = withData.length
        ? withData.reduce((sum, r) => sum + r.efficiency, 0) / withData.length
        : null;
      return {
        moduleId,
        label: moduleRows[0].module_name || `Módulo ${moduleRows[0].module_number}`,
        value: avg === null ? null : Math.round(avg * 100) / 100,
      };
    });
}

/**
 * Efficiency per module over the given rows, weighted by target: sum(produced) * 100 / sum(target),
 * the official SAM-based formula (SQL fn_eficiencia_periodo_*) applied across shifts. Sewing rows
 * carry `total_produced` (completed + scrap + rejected); stamping rows only `total_completed`.
 * Rows without a target or without output are ignored, so a module with no target
 * is null ("no data") while a module with target and no output is a real 0.
 */
export function aggregateWeightedEfficiencyByModule(
  rows: ModuleEfficiencyRow[],
): ModuleEfficiencyPoint[] {
  const byModule = new Map<number, ModuleEfficiencyRow[]>();
  for (const row of rows) {
    byModule.set(row.module_id, [...(byModule.get(row.module_id) ?? []), row]);
  }
  return [...byModule.entries()]
    .sort(([, a], [, b]) => a[0].module_number - b[0].module_number)
    .map(([moduleId, moduleRows]) => {
      // A row counts only with both target and output; a missing output is no data, not 0.
      const measured = moduleRows.filter(
        (r) => (r.unit_target ?? 0) > 0 && (r.total_produced ?? r.total_completed) != null,
      );
      const target = measured.reduce((sum, r) => sum + (r.unit_target as number), 0);
      const produced = measured.reduce(
        (sum, r) => sum + (r.total_produced ?? (r.total_completed as number)),
        0,
      );
      return {
        moduleId,
        label: moduleRows[0].module_name || `Módulo ${moduleRows[0].module_number}`,
        value: target > 0 ? Math.round((produced * 10000) / target) / 100 : null,
      };
    });
}

export interface ModuleDailySeries {
  moduleId: number;
  label: string;
  points: DailyPoint[];
}

/**
 * Splits the rows by module and applies a daily aggregation (e.g. `aggregateDailyEfficiency`) to
 * each one, so a module's line follows the same rule as the area line. Sorted by module number.
 */
export function aggregateDailyByModule(
  rows: ModuleEfficiencyRow[],
  aggregate: (moduleRows: ModuleEfficiencyRow[]) => DailyPoint[],
): ModuleDailySeries[] {
  const byModule = new Map<number, ModuleEfficiencyRow[]>();
  for (const row of rows) {
    byModule.set(row.module_id, [...(byModule.get(row.module_id) ?? []), row]);
  }
  return [...byModule.entries()]
    .sort(([, a], [, b]) => a[0].module_number - b[0].module_number)
    .map(([moduleId, moduleRows]) => ({
      moduleId,
      label: moduleRows[0].module_name || `Módulo ${moduleRows[0].module_number}`,
      points: aggregate(moduleRows),
    }));
}
