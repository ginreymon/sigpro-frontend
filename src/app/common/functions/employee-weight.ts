import { EmployeeSnapshot } from '../../models/production/work-session';

// Espejo de dbo.fn_peso_empleado: aprendiz siempre 0.5 fijo (sin
// prorratear); operario regular es 1.0 * fracción de hora trabajada
// (worked_minutes_per_hour / 60, NULL = hora completa).
export function employeeWeight(e: EmployeeSnapshot): number {
  if (e.is_apprentice) return 0.5;
  const minutes = e.worked_minutes_per_hour ?? 60;
  return Math.round((minutes / 60) * 10) / 10;
}
