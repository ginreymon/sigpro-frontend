import { Component, DestroyRef, inject, signal, computed } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { interval, of } from 'rxjs';
import { catchError, finalize, map, startWith, switchMap, take, tap } from 'rxjs/operators';
import { ModuleDetailBottomSheet } from '../../../shared/components/module-detail-bottom-sheet/module-detail-bottom-sheet';
import { UiIcon } from '../../../shared/elements/ui-icon/ui-icon';
import { ProductivityService } from '../../../services/production/productivity-service';
import { ModuleEfficiencyStatus } from '../../../models/production/module-efficiency-status';
import { AppConfigService } from '../../../services/core/app-config-service';
import { computePlantaStats } from '../../../common/functions/planta-summary';
import { LoaderService } from '../../../services/common/loader-service';
import { EfficiencySummaryBar } from '../../../shared/elements/efficiency-summary-bar/efficiency-summary-bar';
import { PanelLayout } from '../../../shared/components/panel-layout/panel-layout';
import { ModuleService } from '../../../services/production/module-service';
import { RouteContextService } from '../../../services/core/route-context-service';
import { DateRangeForm } from '../../../shared/components/date-range-form/date-range-form';
import { ModuleEfficiencyCard } from '../../../shared/components/module-efficiency-card/module-efficiency-card';

@Component({
  selector: 'app-module-panel',
  imports: [ModuleDetailBottomSheet, UiIcon, EfficiencySummaryBar, PanelLayout, DateRangeForm, ModuleEfficiencyCard],
  templateUrl: './module-panel.html',
})
export class ModulePanel {
  private productivityService = inject(ProductivityService);
  private loaderService = inject(LoaderService);
  private destroyRef = inject(DestroyRef);
  private appConfig = inject(AppConfigService);
  private moduleService = inject(ModuleService);
  private routeContextService = inject(RouteContextService);

  selectedModule = signal<ModuleEfficiencyStatus | null>(null);
  sheetVisible = signal(false);
  showDateFilter = signal(false);
  readonly modules = signal<ModuleEfficiencyStatus[]>([]);

  readonly plantaModule = computed<ModuleEfficiencyStatus>(() => {
    const mods = this.modules();
    const { active, paused, relevant, status, efficiency } = computePlantaStats(mods);
    const ref = active[0] ?? paused[0] ?? mods[0];

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
      operator_count:     relevant.reduce((s, m) => s + (m.operator_count     ?? 0), 0),
      employees_snapshot: relevant.reduce((s, m) => s + (m.employees_snapshot ?? 0), 0),
      total_completed:    relevant.reduce((s, m) => s + (m.total_completed    ?? 0), 0),
      total_rejected:     relevant.reduce((s, m) => s + (m.total_rejected     ?? 0), 0),
      total_scrap:        relevant.reduce((s, m) => s + (m.total_scrap        ?? 0), 0),
      unit_target:        relevant.reduce((s, m) => s + (m.unit_target        ?? 0), 0),
      total_ordered:      relevant.reduce((s, m) => s + (m.total_ordered      ?? 0), 0),
      total_planned:      relevant.reduce((s, m) => s + (m.total_planned      ?? 0), 0),
      total_produced:     relevant.reduce((s, m) => s + (m.total_produced     ?? 0), 0),
    };
  });

  readonly activeModuleCount = computed(() =>
    this.modules().filter((m) => m.status === 'ACTIVE').length,
  );

  readonly allModules = computed<ModuleEfficiencyStatus[]>(() =>
    this.modules().length ? [this.plantaModule(), ...this.modules()] : [],
  );

  constructor() {
    let allowedModuleIds: Set<number> | null = null;

    this.appConfig.load().pipe(
      take(1),
      switchMap(() => {
        const coreModuleId = this.routeContextService.currentModule?.id;
        return coreModuleId
          ? this.moduleService.all({ core_module_id: coreModuleId })
          : of([]);
      }),
      tap((mods) => { allowedModuleIds = mods.length ? new Set(mods.map((m) => m.id)) : null; }),
      switchMap(() => interval(30_000).pipe(startWith(0))),
      switchMap((_, index) => {
        if (index === 0) this.loaderService.showLoader();
        return this.productivityService.getModuleShiftSummary().pipe(
          map((data) => allowedModuleIds ? data.filter((m) => allowedModuleIds!.has(m.module_id)) : data),
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
    this.showDateFilter.update((v) => !v);
  }
}
