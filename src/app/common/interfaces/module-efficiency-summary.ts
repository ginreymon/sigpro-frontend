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
}
