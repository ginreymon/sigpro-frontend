import { ModuleEfficiencyStatus } from '../../models/production/module-efficiency-status';

export interface PlantaStats {
  active:      ModuleEfficiencyStatus[];
  paused:      ModuleEfficiencyStatus[];
  relevant:    ModuleEfficiencyStatus[];
  status:      ModuleEfficiencyStatus['status'];
  efficiency:  number;
}

export function computePlantaStats(mods: ModuleEfficiencyStatus[]): PlantaStats {
  const active   = mods.filter(m => m.status === 'ACTIVE');
  const paused   = mods.filter(m => m.status === 'PAUSED');
  const relevant = [...active, ...paused];
  const status: ModuleEfficiencyStatus['status'] = active.length
    ? 'ACTIVE'
    : paused.length
      ? 'PAUSED'
      : 'INACTIVE';

  // Sin módulos activos/pausados, se usa la eficiencia del día de todos los
  // módulos (inactivos) en vez de caer a 0 — igual que cada card individual.
  const effSource = relevant.length ? relevant : mods;
  const withEff    = effSource.filter(m => m.efficiency > 0);
  const efficiency = withEff.length
    ? withEff.reduce((s, m) => s + m.efficiency, 0) / withEff.length
    : 0;

  return { active, paused, relevant, status, efficiency };
}
