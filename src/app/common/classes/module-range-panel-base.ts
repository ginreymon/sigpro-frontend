import { DestroyRef, Signal, inject, signal, computed } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subscription, interval, of } from 'rxjs';
import { catchError, finalize, startWith, switchMap, take } from 'rxjs/operators';
import { AppConfigService } from '../../services/core/app-config-service';
import { LoaderService } from '../../services/common/loader-service';
import { RouteContextService } from '../../services/core/route-context-service';
import { ModuleEfficiencyStatus } from '../../models/production/module-efficiency-status';
import { ModuleEfficiencyRow } from '../../models/production/module-efficiency-row';
import { ModuleProductivityService } from '../interfaces/module-productivity-service';
import { ModuleEfficiencySummary } from '../interfaces/module-efficiency-summary';
import { DateRangeValue } from '../../shared/components/form-controls/date-range-form/date-range-form';
import { localTodayStr } from '../functions/date-utils';

// Shared base for ModulePanel and MachinePanel: same "today" polling and the same
// cards for the range queried in the date-range-form. plantaModule() stays abstract
// because each panel builds the PLANTA card differently (stamping adds
// last_worked_date/last_worked_efficiency, production does not).
export abstract class ModuleRangePanelBase {
  protected abstract readonly productivityService: ModuleProductivityService;
  abstract readonly plantaModule: Signal<ModuleEfficiencyStatus>;
  protected abstract readonly plantaLabel: string;

  protected loaderService = inject(LoaderService);
  protected destroyRef = inject(DestroyRef);
  protected appConfig = inject(AppConfigService);
  protected routeContextService = inject(RouteContextService);

  selectedModule = signal<ModuleEfficiencyStatus | null>(null);
  sheetVisible = signal(false);
  showDateFilter = signal(false);
  // Range the date filter opens with: today to today, refreshed every time the filter opens.
  readonly defaultRange = signal<DateRangeValue>(ModuleRangePanelBase.todayRange());
  readonly modules = signal<ModuleEfficiencyStatus[]>([]);

  rangeLoading = signal(false);
  rangeSearched = signal(false);
  rangeRows = signal<ModuleEfficiencyRow[]>([]);
  rangeError = signal(false);
  // Last queried range, kept so the error state can offer a retry.
  private lastRange: DateRangeValue | null = null;
  // In-flight range request; a new query cancels it so only one request is ever pending.
  private rangeSub?: Subscription;

  readonly activeModuleCount = computed(() =>
    this.modules().filter((m) => m.status === 'ACTIVE').length,
  );

  // Inactive plant: shows the total number of modules used to compute
  // Completed/Efficiency instead of the active count (0).
  readonly plantaModuleCount = computed(() => {
    const mods = this.modules();
    if (!mods.length) return undefined;
    return this.plantaModule().status === 'INACTIVE' ? mods.length : this.activeModuleCount();
  });

  // Units offered by the period filter: the live module/machine list.
  readonly unitOptions = computed(() =>
    this.modules().map(m => ({ id: m.module_id, name: m.name })),
  );

  readonly allModules = computed<ModuleEfficiencyStatus[]>(() =>
    this.modules().length ? [this.plantaModule(), ...this.modules()] : [],
  );

  // Informative cards for the range queried in the date form: same grouping/average
  // (efficiency > 0 only, zeros are skipped) that ModuleDetailModal.tableSummary uses for
  // "RESUMEN · PLANTA GENERAL" / "RESUMEN · MÓDULO".
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
    return this.buildRangeSummary(rows, 0, 0, this.plantaLabel, operatorCount);
  });

  readonly rangeAllSummaries = computed<ModuleEfficiencySummary[]>(() => {
    const planta = this.rangePlantaSummary();
    return planta ? [planta, ...this.rangeModuleSummaries()] : [];
  });

  protected initPanel(): void {
    this.destroyRef.onDestroy(() => this.rangeSub?.unsubscribe());
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
    ).subscribe((data) => this.modules.set(data));
  }

  openSheet(mod: ModuleEfficiencyStatus): void {
    this.selectedModule.set(mod);
    this.sheetVisible.set(true);
  }

  closeSheet(): void {
    this.sheetVisible.set(false);
  }

  private static todayRange(): DateRangeValue {
    const today = localTodayStr();
    return { startDate: today, endDate: today };
  }

  toggleDateFilter(): void {
    const next = !this.showDateFilter();
    this.showDateFilter.set(next);

    if (next) {
      // Open with today preselected and already queried, so the panel is never an empty prompt.
      const range = ModuleRangePanelBase.todayRange();
      this.defaultRange.set(range);
      this.onRangeSearch(range);
    } else {
      this.rangeSub?.unsubscribe();
      this.rangeSearched.set(false);
      this.rangeLoading.set(false);
      this.rangeError.set(false);
      this.rangeRows.set([]);
    }
  }

  onRangeSearch(value: DateRangeValue): void {
    this.lastRange = value;
    this.rangeSub?.unsubscribe();
    this.rangeLoading.set(true);
    this.rangeSearched.set(true);
    this.rangeError.set(false);

    this.rangeSub = this.productivityService.getModuleEfficiency(value.startDate, value.endDate).pipe(
      finalize(() => this.rangeLoading.set(false)),
    ).subscribe({
      next: (rows) => this.rangeRows.set(rows),
      error: () => {
        this.rangeRows.set([]);
        this.rangeError.set(true);
      },
    });
  }

  retryRangeSearch(): void {
    if (this.lastRange) this.onRangeSearch(this.lastRange);
  }
}
