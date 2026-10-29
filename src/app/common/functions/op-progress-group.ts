import { OpProgressRow } from '../../models/common/op-progress-row';

export interface OpProgressTotals {
  total: number;
  done: number;
  pending: number;
  // null when no row has usable quantities.
  pct: number | null;
}

export interface OpProgressModuleGroup extends OpProgressTotals {
  moduleId: number;
  moduleName: string;
  moduleNumber: number;
  rows: OpProgressRow[];
}

export interface OpProgressAreaGroup extends OpProgressTotals {
  areaId: number;
  areaName: string;
  modules: OpProgressModuleGroup[];
}

// Rows with null quantities are listed but excluded from totals so they do not skew the percentage.
function totalsOf(rows: OpProgressRow[]): OpProgressTotals {
  let total = 0;
  let done = 0;
  let counted = 0;
  for (const r of rows) {
    if (r.done_qty == null || r.total_qty == null) continue;
    total += r.total_qty;
    done += r.done_qty;
    counted++;
  }
  return {
    total,
    done,
    pending: Math.max(0, total - done),
    pct: counted && total > 0 ? Math.min(100, (done / total) * 100) : null,
  };
}

// Groups rows by area then module. Areas and modules come from the data, none is hardcoded.
export function groupOpProgress(rows: OpProgressRow[]): OpProgressAreaGroup[] {
  const areas = new Map<number, { name: string; modules: Map<number, OpProgressRow[]> }>();
  for (const r of rows) {
    const area = areas.get(r.area_id) ?? { name: r.area_name, modules: new Map() };
    const list = area.modules.get(r.module_id) ?? [];
    list.push(r);
    area.modules.set(r.module_id, list);
    areas.set(r.area_id, area);
  }
  return [...areas.entries()].map(([areaId, area]) => {
    const modules = [...area.modules.values()]
      .map((moduleRows) => ({
        moduleId: moduleRows[0].module_id,
        moduleName: moduleRows[0].module_name,
        moduleNumber: moduleRows[0].module_number,
        rows: moduleRows,
        ...totalsOf(moduleRows),
      }))
      .sort((a, b) => a.moduleNumber - b.moduleNumber);
    return {
      areaId,
      areaName: area.name,
      modules,
      ...totalsOf(modules.flatMap((m) => m.rows)),
    };
  });
}
