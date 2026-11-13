export interface ModuleEfficiencySummary {
  moduleId: number;
  number: number;
  name: string;
  operatorCount: number;
  efficiency: number;
  totalCompleted: number;
  totalRejected: number;
  totalScrap: number;
  unitTarget: number;
  totalProduced: number;
  producedMinutes: number;
  // Active employees; absent in range rows, so operatorCount is the fallback.
  employeesSnapshot?: number;
}
