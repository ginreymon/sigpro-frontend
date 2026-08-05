import { Component, DestroyRef, inject, signal, computed } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { interval, of } from 'rxjs';
import { catchError, finalize, startWith, switchMap, take } from 'rxjs/operators';
import { ModuleDetailModal } from '../../../shared/components/production/modals/module-detail-modal/module-detail-modal';
import { ProductivityService } from '../../../services/production/productivity-service';
import { ModuleEfficiencyStatus } from '../../../models/production/module-efficiency-status';
import { AppConfigService } from '../../../services/core/app-config-service';
import { computePlantaStats } from '../../../common/functions/planta-summary';
import { LoaderService } from '../../../services/common/loader-service';
import { EfficiencySummaryBar } from '../../../shared/components/production/widgets/efficiency-summary-bar/efficiency-summary-bar';
import { PanelLayout } from '../../../shared/components/layout/panel-layout/panel-layout';
import { RouteContextService } from '../../../services/core/route-context-service';
import { DateRangeForm, DateRangeValue } from '../../../shared/components/form-controls/date-range-form/date-range-form';
import { ModuleEfficiencyCard } from '../../../shared/components/production/cards/module-efficiency-card/module-efficiency-card';
import { RangeEfficiencyCard } from '../../../shared/components/production/cards/range-efficiency-card/range-efficiency-card';
import { ModuleEfficiencyRow } from '../../../models/production/module-efficiency-row';
import { ModuleEfficiencySummary } from '../../../common/interfaces/module-efficiency-summary';

@Component({
  selector: 'app-module-panel',
  imports: [ModuleDetailModal, EfficiencySummaryBar, PanelLayout, DateRangeForm, ModuleEfficiencyCard, RangeEfficiencyCard],
  templateUrl: './module-panel.html',
})
export class ModulePanel {
  private productivityService = inject(ProductivityService);
  private loaderService = inject(LoaderService);
  private destroyRef = inject(DestroyRef);
  private appConfig = inject(AppConfigService);
  private routeContextService = inject(RouteContextService);

  selectedModule = signal<ModuleEfficiencyStatus | null>(null);
  sheetVisible = signal(false);
  showDateFilter = signal(false);
  readonly modules = signal<ModuleEfficiencyStatus[]>([]);

  rangeLoading = signal(false);
  rangeSearched = signal(false);
  rangeRows = signal<ModuleEfficiencyRow[]>([]);

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

  readonly activeModuleCount = computed(() =>
    this.modules().filter((m) => m.status === 'ACTIVE').length,
  );

  // Planta inactiva: muestra la cantidad total de módulos con los que se
  // calcularon Completadas/Eficiencia, en vez del conteo de activos (0).
  readonly plantaModuleCount = computed(() => {
    const mods = this.modules();
    if (!mods.length) return undefined;
    return this.plantaModule().status === 'INACTIVE' ? mods.length : this.activeModuleCount();
  });

  readonly allModules = computed<ModuleEfficiencyStatus[]>(() =>
    this.modules().length ? [this.plantaModule(), ...this.modules()] : [],
  );

  // Cards informativas del rango consultado en el formulario de fecha: mismo
  // agrupamiento/promedio (efficiency>0 no cuenta para el 0) que usa
  // ModuleDetailModal.tableFooter para "RESUMEN · PLANTA GENERAL"/"RESUMEN · MÓDULO".
  private buildRangeSummary(
    rows: ModuleEfficiencyRow[],
    moduleId: number,
    number: number,
    name: string,
    operatorCount: number,
  ): ModuleEfficiencySummary {
    const withEff = rows.filter(r => r.efficiency > 0);
    const efficiency = withEff.length
      ? withEff.reduce((s, r) => s + r.efficiency, 0) / withEff.length
      : 0;
    const sum = (field: keyof ModuleEfficiencyRow) =>
      rows.reduce((s, r) => s + ((r[field] as number) ?? 0), 0);

    return {
      moduleId,
      number,
      name,
      operatorCount,
      efficiency: Math.round(efficiency * 100) / 100,
      totalCompleted: sum('total_completed'),
      totalRejected: sum('total_rejected'),
      totalScrap: sum('total_scrap'),
      unitTarget: Math.round(sum('unit_target')),
    };
  }

  readonly rangeModuleSummaries = computed<ModuleEfficiencySummary[]>(() => {
    const byModule = new Map<number, ModuleEfficiencyRow[]>();
    for (const row of this.rangeRows()) {
      const list = byModule.get(row.module_id) ?? [];
      list.push(row);
      byModule.set(row.module_id, list);
    }
    return [...byModule.values()].map(moduleRows => this.buildRangeSummary(
      moduleRows,
      moduleRows[0].module_id,
      moduleRows[0].module_number,
      moduleRows[0].module_name,
      moduleRows[0].module_operator_count,
    ));
  });

  readonly rangePlantaSummary = computed<ModuleEfficiencySummary | null>(() => {
    const rows = this.rangeRows();
    if (!rows.length) return null;
    const operatorCount = this.rangeModuleSummaries().reduce((s, m) => s + m.operatorCount, 0);
    return this.buildRangeSummary(rows, 0, 0, 'PLANTA', operatorCount);
  });

  readonly rangeAllSummaries = computed<ModuleEfficiencySummary[]>(() => {
    const planta = this.rangePlantaSummary();
    return planta ? [planta, ...this.rangeModuleSummaries()] : [];
  });

  constructor() {
    const coreModuleId = this.routeContextService.currentModule?.id;

    this.appConfig.load().pipe(
      take(1),
      switchMap(() => interval(30_000).pipe(startWith(0))),
      switchMap((_, index) => {
        if (index === 0) this.loaderService.showLoader();
        return this.productivityService.getModuleShiftSummary(coreModuleId).pipe(
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
    const next = !this.showDateFilter();
    this.showDateFilter.set(next);

    if (!next) {
      this.rangeSearched.set(false);
      this.rangeLoading.set(false);
      this.rangeRows.set([]);
    }
  }

  onRangeSearch(value: DateRangeValue): void {
    this.rangeLoading.set(true);
    this.rangeSearched.set(true);

    this.productivityService.getModuleEfficiency(value.startDate, value.endDate).pipe(
      finalize(() => this.rangeLoading.set(false)),
    ).subscribe({ next: (rows) => this.rangeRows.set(rows) });
  }
}
