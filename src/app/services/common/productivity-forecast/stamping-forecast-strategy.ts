import { ForecastStrategy } from './forecast.types';

// Mirror of dbo.fn_eficiencia_periodo_estampacion (not the production formula):
//   target = max(0, interval - additional_time*60) / 3600 * tasks_per_hour * employees
//   efficiency = completed * 100 / target   (scrap/rejected do not exist in stamping)
export const stampingForecast: ForecastStrategy = (i) => {
  const tasksPerHour = i.tasksPerHour && i.tasksPerHour > 0 ? i.tasksPerHour : i.sam > 0 ? 60 / i.sam : 0;
  if (!(tasksPerHour > 0)) return null;
  const netSeconds = Math.max(0, i.elapsedSeconds - (i.additionalMinutes ?? 0) * 60);
  const target = i.baseline.unit_target + (netSeconds / 3600) * tasksPerHour * i.employees;
  if (!(target > 0)) return null;
  return ((i.baseline.total_completed + i.newUnits) * 100) / target;
};
