import { ForecastStrategy } from './forecast.types';

// Mirror of dbo.fn_eficiencia_periodo_produccion:
//   target = interval * employees / (60 * SAM)
//   efficiency = (completed + scrap + rejected) * 100 / target
// The new record adds its own interval to the shift target already counted.
export const sewingForecast: ForecastStrategy = (i) => {
  if (!(i.sam > 0)) return null;
  const target = i.baseline.unit_target + (Math.max(0, i.elapsedSeconds) * i.employees) / (60 * i.sam);
  if (!(target > 0)) return null;
  return ((i.baseline.total_produced + i.newUnits) * 100) / target;
};
