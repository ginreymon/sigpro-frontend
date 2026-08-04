import { Component, DestroyRef, inject, signal, computed } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { interval, of } from 'rxjs';
import { catchError, finalize, startWith, switchMap, take } from 'rxjs/operators';
import { ModuleDetailModal } from '../../../shared/components/production/modals/module-detail-modal/module-detail-modal';
import { UiIcon } from '../../../shared/elements/ui-icon/ui-icon';
import { StampingProductivityService } from '../../../services/stamping/stamping-productivity-service';
import { ModuleEfficiencyStatus } from '../../../models/production/module-efficiency-status';
import { AppConfigService } from '../../../services/core/app-config-service';
import { computePlantaStats } from '../../../common/functions/planta-summary';
import { LoaderService } from '../../../services/common/loader-service';
import { EfficiencySummaryBar } from '../../../shared/components/production/widgets/efficiency-summary-bar/efficiency-summary-bar';
import { PanelLayout } from '../../../shared/components/layout/panel-layout/panel-layout';
import { RouteContextService } from '../../../services/core/route-context-service';
import { DateRangeForm } from '../../../shared/components/form-controls/date-range-form/date-range-form';
import { StampingEfficiencyCard } from '../../../shared/components/production/cards/stamping-efficiency-card/stamping-efficiency-card';

@Component({
  selector: 'app-machine-panel',
  imports: [ModuleDetailModal, UiIcon, EfficiencySummaryBar, PanelLayout, DateRangeForm, StampingEfficiencyCard],
  templateUrl: './machine-panel.html',
})
export class MachinePanel {
  private stampingProductivityService = inject(StampingProductivityService);
  private loaderService = inject(LoaderService);
  private destroyRef = inject(DestroyRef);
  private appConfig = inject(AppConfigService);
  private routeContextService = inject(RouteContextService);

  readonly service = this.stampingProductivityService;

  selectedModule = signal<ModuleEfficiencyStatus | null>(null);
  sheetVisible = signal(false);
  showDateFilter = signal(false);
  readonly modules = signal<ModuleEfficiencyStatus[]>([]);

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
      name: 'PLANTA',
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
      last_worked_date:       lastWorkedDate,
      last_worked_efficiency: lastWorkedEfficiency,
    };
  });

  readonly activeModuleCount = computed(() => this.modules().filter(m => m.status === 'ACTIVE').length);

  readonly allModules = computed<ModuleEfficiencyStatus[]>(() =>
    this.modules().length ? [this.plantaModule(), ...this.modules()] : [],
  );

  constructor() {
    const coreModuleId = this.routeContextService.currentModule?.id;

    this.appConfig.load().pipe(
      take(1),
      switchMap(() => interval(30_000).pipe(startWith(0))),
      switchMap((_, index) => {
        if (index === 0) this.loaderService.showLoader();
        return this.stampingProductivityService.getModuleShiftSummary(coreModuleId).pipe(
          catchError(() => of([] as ModuleEfficiencyStatus[])),
          finalize(() => this.loaderService.hideLoader()),
        );
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(data => this.modules.set(data));
  }

  openSheet(mod: ModuleEfficiencyStatus): void {
    this.selectedModule.set(mod);
    this.sheetVisible.set(true);
  }

  closeSheet(): void {
    this.sheetVisible.set(false);
  }

  toggleDateFilter(): void {
    this.showDateFilter.update(v => !v);
  }
}
