import { Component, inject, computed } from '@angular/core';
import { ModuleDetailModal } from '../../../shared/components/production/modals/module-detail-modal/module-detail-modal';
import { ProductivityService } from '../../../services/production/productivity-service';
import { ModuleEfficiencyStatus } from '../../../models/production/module-efficiency-status';
import { computePlantaStats } from '../../../common/functions/planta-summary';
import { EfficiencySummaryBar } from '../../../shared/components/production/widgets/efficiency-summary-bar/efficiency-summary-bar';
import { PanelLayout } from '../../../shared/components/layout/panel-layout/panel-layout';
import { ModuleEfficiencyCard } from '../../../shared/components/production/cards/module-efficiency-card/module-efficiency-card';
import { RangeResultsPanel } from '../../../shared/components/production/widgets/range-results-panel/range-results-panel';
import { ModuleRangePanelBase } from '../../../common/classes/module-range-panel-base';

@Component({
  selector: 'app-module-panel',
  imports: [ModuleDetailModal, EfficiencySummaryBar, PanelLayout, ModuleEfficiencyCard, RangeResultsPanel],
  templateUrl: './module-panel.html',
})
export class ModulePanel extends ModuleRangePanelBase {
  protected readonly productivityService = inject(ProductivityService);
  protected readonly plantaLabel = 'CONFECCIÓN';

  readonly plantaModule = computed<ModuleEfficiencyStatus>(() => {
    const mods = this.modules();
    const { active, paused, relevant, status, efficiency } = computePlantaStats(mods);
    const ref = active[0] ?? paused[0] ?? mods[0];

    // Planta inactiva (sin módulos activos/pausados): las barras muestran las
    // cantidades del día de todos los módulos en vez de 0, igual que la eficiencia.
    const source = relevant.length ? relevant : mods;

    return {
      module_id: 0,
      number: 0,
      name: this.plantaLabel,
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
      operator_count:     source.reduce((s, m) => s + (m.operator_count     ?? 0), 0),
      employees_snapshot: source.reduce((s, m) => s + (m.employees_snapshot ?? 0), 0),
      total_completed:    source.reduce((s, m) => s + (m.total_completed    ?? 0), 0),
      total_rejected:     source.reduce((s, m) => s + (m.total_rejected     ?? 0), 0),
      total_scrap:        source.reduce((s, m) => s + (m.total_scrap        ?? 0), 0),
      unit_target:        source.reduce((s, m) => s + (m.unit_target        ?? 0), 0),
      total_ordered:      source.reduce((s, m) => s + (m.total_ordered      ?? 0), 0),
      total_planned:      source.reduce((s, m) => s + (m.total_planned      ?? 0), 0),
      total_produced:     source.reduce((s, m) => s + (m.total_produced     ?? 0), 0),
    };
  });

  constructor() {
    super();
    this.initPanel();
  }
}
