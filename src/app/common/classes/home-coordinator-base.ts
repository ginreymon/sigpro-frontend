import { DestroyRef, inject, signal, computed } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { interval, of } from 'rxjs';
import { catchError, startWith, switchMap, take } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AppConfigService } from '../../services/core/app-config-service';
import { ModuleEfficiencyStatus } from '../../models/production/module-efficiency-status';
import { efficiencyTextColor } from '../functions/efficiency-color';
import { computePlantaStats } from '../functions/planta-summary';
import { currentMonthLabel, currentMonthRange } from '../functions/date-utils';
import { aggregateMonthlyEfficiency } from '../functions/module-efficiency-aggregate';
import { ModuleProductivityService } from '../interfaces/module-productivity-service';

export abstract class HomeCoordinatorBase {
  protected abstract readonly productivityService: ModuleProductivityService;

  protected appConfig = inject(AppConfigService);
  protected destroyRef = inject(DestroyRef);
  protected router = inject(Router);

  readonly modules = signal<ModuleEfficiencyStatus[]>([]);
  readonly monthlyEfficiency = signal(0);
  readonly monthlyCompleted = signal(0);

  readonly activeModuleCount = computed(() =>
    this.modules().filter((m) => m.status === 'ACTIVE').length,
  );

  // Month and year, shown as the label of the monthly productivity card.
  readonly monthLabel = computed(() => `${currentMonthLabel()} ${new Date().getFullYear()}`);

  readonly plantaModule = computed(() => {
    const mods = this.modules();
    const { active, paused, relevant, status, efficiency } = computePlantaStats(mods);
    const ref = active[0] ?? paused[0] ?? mods[0];

    // Planta inactiva: Completadas usa todos los módulos en vez de 0, igual que la eficiencia.
    const source = relevant.length ? relevant : mods;

    return {
      status,
      location: ref?.location ?? '',
      efficiency,
      total_completed: source.reduce((s, m) => s + (m.total_completed ?? 0), 0),
    };
  });

  // Planta inactiva: muestra la cantidad total de módulos con los que se
  // calcularon Completadas/Eficiencia, en vez del conteo de activos (0).
  readonly plantaModuleCount = computed(() => {
    const mods = this.modules();
    if (!mods.length) return undefined;
    return this.plantaModule().status === 'INACTIVE' ? mods.length : this.activeModuleCount();
  });

  protected initCoordinator(): void {
    this.appConfig.load().pipe(
      take(1),
      switchMap(() => interval(30_000).pipe(startWith(0))),
      switchMap(() =>
        this.productivityService.getModuleShiftSummary().pipe(
          catchError(() => of([] as ModuleEfficiencyStatus[])),
        ),
      ),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((data) => this.modules.set(data));

    this.loadMonthlyEfficiency();
  }

  abstract goToPanel(): void;

  private loadMonthlyEfficiency(): void {
    const { startDate, endDate } = currentMonthRange();

    this.productivityService.getModuleEfficiency(startDate, endDate).subscribe({
      next: (rows) => {
        const { efficiency, completed } = aggregateMonthlyEfficiency(rows);
        this.monthlyEfficiency.set(efficiency);
        this.monthlyCompleted.set(completed);
      },
    });
  }

  efficiencyColor(efficiency: number, status: string): string {
    return efficiencyTextColor(
      efficiency,
      this.appConfig.highEfficiencyLimit,
      this.appConfig.lowEfficiencyLimit,
      status === 'ACTIVE',
    );
  }
}
