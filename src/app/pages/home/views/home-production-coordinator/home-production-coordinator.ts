import { Component, DestroyRef, inject, signal, computed } from '@angular/core';
import { EfficiencySummaryBar } from '../../../../shared/components/production/widgets/efficiency-summary-bar/efficiency-summary-bar';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { interval, of } from 'rxjs';
import { catchError, startWith, switchMap, take } from 'rxjs/operators';
import { Router } from '@angular/router';
import { ProductivityService } from '../../../../services/production/productivity-service';
import { AppConfigService } from '../../../../services/core/app-config-service';
import { ModuleEfficiencyStatus } from '../../../../models/production/module-efficiency-status';
import { efficiencyTextColor } from '../../../../common/functions/efficiency-color';
import { computePlantaStats } from '../../../../common/functions/planta-summary';
import { currentMonthLabel } from '../../../../common/functions/date-utils';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-home-production-coordinator',
  imports: [EfficiencySummaryBar],
  templateUrl: './home-production-coordinator.html',
})
export class HomeProductionCoordinator {
  private productivityService = inject(ProductivityService);
  private appConfig = inject(AppConfigService);
  private destroyRef = inject(DestroyRef);
  private router = inject(Router);

  readonly modules = signal<ModuleEfficiencyStatus[]>([]);
  readonly monthlyEfficiency = signal(0);
  readonly monthlyCompleted = signal(0);

  readonly activeModuleCount = computed(() =>
    this.modules().filter((m) => m.status === 'ACTIVE').length,
  );

  readonly monthLabel = computed(() => currentMonthLabel());

  readonly plantaModule = computed(() => {
    const mods = this.modules();
    const { active, paused, relevant, status, efficiency } = computePlantaStats(mods);
    const ref = active[0] ?? paused[0] ?? mods[0];

    return {
      status,
      location: ref?.location ?? '',
      efficiency,
      total_completed: relevant.reduce((s, m) => s + (m.total_completed ?? 0), 0),
    };
  });

  constructor() {
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

  goToModulePanel(): void {
    this.router.navigateByUrl(environment.MODULE_PANEL_URL);
  }

  private loadMonthlyEfficiency(): void {
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
    const endDate = now.toISOString().slice(0, 10);

    this.productivityService.getModuleEfficiency(startDate, endDate).subscribe({
      next: (rows) => {
        // Días sin registros o en cero no cuentan para el promedio.
        const withData = rows.filter(r => (r.efficiency ?? 0) > 0);
        const avg = withData.length
          ? withData.reduce((sum, r) => sum + r.efficiency, 0) / withData.length
          : 0;
        this.monthlyEfficiency.set(Math.round(avg * 100) / 100);
        this.monthlyCompleted.set(rows.reduce((sum, r) => sum + (r.total_completed ?? 0), 0));
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
