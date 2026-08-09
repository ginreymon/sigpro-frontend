import { ModuleEfficiencyRow } from '../../models/production/module-efficiency-row';

export interface MonthlyEfficiencySummary {
  efficiency: number;
  completed: number;
}

/**
 * Días sin registros o en cero no cuentan para el promedio de eficiencia.
 */
export function aggregateMonthlyEfficiency(rows: ModuleEfficiencyRow[]): MonthlyEfficiencySummary {
  const withData = rows.filter((r) => (r.efficiency ?? 0) > 0);
  const avg = withData.length
    ? withData.reduce((sum, r) => sum + r.efficiency, 0) / withData.length
    : 0;

  return {
    efficiency: Math.round(avg * 100) / 100,
    completed: rows.reduce((sum, r) => sum + (r.total_completed ?? 0), 0),
  };
}
