import { Component, inject, computed } from '@angular/core';
import { ModuleDetailModal } from '../../../shared/components/production/modals/module-detail-modal/module-detail-modal';
import { StampingProductivityService } from '../../../services/stamping/stamping-productivity-service';
import { ModuleEfficiencyStatus } from '../../../models/production/module-efficiency-status';
import { computePlantaStats } from '../../../common/functions/planta-summary';
import { EfficiencySummaryBar } from '../../../shared/components/production/widgets/efficiency-summary-bar/efficiency-summary-bar';
import { PanelLayout } from '../../../shared/components/layout/panel-layout/panel-layout';
import { DateRangeForm } from '../../../shared/components/form-controls/date-range-form/date-range-form';
import { StampingEfficiencyCard } from '../../../shared/components/production/cards/stamping-efficiency-card/stamping-efficiency-card';
import { RangeEfficiencyCard } from '../../../shared/components/production/cards/range-efficiency-card/range-efficiency-card';
import { ModuleRangePanelBase } from '../../../common/classes/module-range-panel-base';

@Component({
  selector: 'app-machine-panel',
  imports: [ModuleDetailModal, EfficiencySummaryBar, PanelLayout, DateRangeForm, StampingEfficiencyCard, RangeEfficiencyCard],
  templateUrl: './machine-panel.html',
})
export class MachinePanel extends ModuleRangePanelBase {
  protected readonly productivityService = inject(StampingProductivityService);
  protected readonly plantaLabel = 'ESTAMPACIÓN';

  readonly service = this.productivityService;

  readonly plantaModule = computed<ModuleEfficiencyStatus>(() => {
    const mods = this.modules();
    const { active, paused, relevant, status, efficiency } = computePlantaStats(mods);
    const ref = active[0] ?? paused[0] ?? mods[0];

    // Planta inactiva: Completadas, Encomendados y sus barras muestran los
    // valores del día de todos los módulos en vez de 0, igual que la eficiencia.
    const completedSource = relevant.length ? relevant : mods;

    // Última jornada: promedio de last_worked_efficiency de los módulos que
    // sí lo retornan (no todos lo tienen, p.ej. si nunca tuvieron jornada previa).
    const withLastWorked = mods.filter(m => m.last_worked_efficiency != null);
    const lastWorkedEfficiency = withLastWorked.length
      ? withLastWorked.reduce((s, m) => s + (m.last_worked_efficiency ?? 0), 0) / withLastWorked.length
      : null;
    const lastWorkedDate = withLastWorked[0]?.last_worked_date ?? null;

    return {
      module_id: 0,
      number: 0,
      name: 'ESTAMPACIÓN',
      location: ref?.location ?? '',
      module_enabled: true,
      work_shift_id: 0,
      work_session_id: 0,
      work_session_activity_id: 0,
      start_time: '',
      work_shift_start_utc: '',
      started_at: '',
      is_active: active.length ? 1 : 0,
      is_pause: 0,
      status,
      period_start: '',
      period_end: '',
      shift_id: 0,
      efficiency,
      operator_count:     completedSource.reduce((s, m) => s + (m.operator_count     ?? 0), 0),
      employees_snapshot: completedSource.reduce((s, m) => s + (m.employees_snapshot ?? 0), 0),
      total_completed:    completedSource.reduce((s, m) => s + (m.total_completed ?? 0), 0),
      total_rejected:     relevant.reduce((s, m) => s + (m.total_rejected     ?? 0), 0),
      total_scrap:        relevant.reduce((s, m) => s + (m.total_scrap        ?? 0), 0),
      unit_target:        completedSource.reduce((s, m) => s + (m.unit_target ?? 0), 0),
      total_ordered:      relevant.reduce((s, m) => s + (m.total_ordered      ?? 0), 0),
      total_planned:      relevant.reduce((s, m) => s + (m.total_planned      ?? 0), 0),
      total_produced:     relevant.reduce((s, m) => s + (m.total_produced     ?? 0), 0),
      minutos_instalados: completedSource.reduce((s, m) => s + (m.minutos_instalados ?? 0), 0),
      last_worked_date:       lastWorkedDate,
      last_worked_efficiency: lastWorkedEfficiency,
    };
  });

  constructor() {
    super();
    this.initPanel();
  }
}
