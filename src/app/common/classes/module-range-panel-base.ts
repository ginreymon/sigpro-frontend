import { DestroyRef, Signal, inject, signal, computed } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { interval, of } from 'rxjs';
import { catchError, finalize, startWith, switchMap, take } from 'rxjs/operators';
import { AppConfigService } from '../../services/core/app-config-service';
import { LoaderService } from '../../services/common/loader-service';
import { RouteContextService } from '../../services/core/route-context-service';
import { ModuleEfficiencyStatus } from '../../models/production/module-efficiency-status';
import { ModuleEfficiencyRow } from '../../models/production/module-efficiency-row';
import { ModuleProductivityService } from '../interfaces/module-productivity-service';
import { ModuleEfficiencySummary } from '../interfaces/module-efficiency-summary';
import { DateRangeValue } from '../../shared/components/form-controls/date-range-form/date-range-form';

// Base compartida por ModulePanel y MachinePanel: mismo polling de "hoy",
// mismas cards del rango consultado en el date-range-form. plantaModule()
// queda abstracto porque cada panel arma la card PLANTA distinto (stamping
// suma last_worked_date/last_worked_efficiency, producción no).
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
  readonly modules = signal<ModuleEfficiencyStatus[]>([]);

  rangeLoading = signal(false);
  rangeSearched = signal(false);
  rangeRows = signal<ModuleEfficiencyRow[]>([]);

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
    return this.buildRangeSummary(rows, 0, 0, this.plantaLabel, operatorCount);
  });

  readonly rangeAllSummaries = computed<ModuleEfficiencySummary[]>(() => {
    const planta = this.rangePlantaSummary();
    return planta ? [planta, ...this.rangeModuleSummaries()] : [];
  });

  protected initPanel(): void {
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
