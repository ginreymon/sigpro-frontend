import { EfficiencyPeriod } from '../../../models/production/efficiency-period';

export type ForecastBaseline = Pick<EfficiencyPeriod, 'total_produced' | 'total_completed' | 'unit_target'>;

// Inputs every area strategy receives. Mirrors the per-record terms of
// dbo.fn_eficiencia_periodo_* so each strategy only adds the new interval.
export interface ForecastInput {
  // Shift totals already persisted (from module-shift-summary).
  baseline: ForecastBaseline;
  // Units about to be registered (area specific: production counts scrap + rejected).
  newUnits: number;
  // Seconds of the new interval (since the last record), already UTC-safe and >= 0.
  elapsedSeconds: number;
  // Weighted headcount (apprentices count 0.5).
  employees: number;
  sam: number;
  // Stamping only.
  tasksPerHour?: number;
  additionalMinutes?: number;
}

// Returns the projected efficiency in percent, or null when it cannot be estimated.
export type ForecastStrategy = (input: ForecastInput) => number | null;
