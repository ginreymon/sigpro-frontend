import { Component, DestroyRef, Type, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NgComponentOutlet } from '@angular/common';
import { Observable } from 'rxjs';
import { ModuleEfficiencyRow } from '../../../../models/production/module-efficiency-row';
import { ModuleProductivityService } from '../../../../common/interfaces/module-productivity-service';
import { ProductivityService } from '../../../../services/production/productivity-service';
import { StampingProductivityService } from '../../../../services/stamping/stamping-productivity-service';
import { currentMonthLabel, currentMonthRange } from '../../../../common/functions/date-utils';
import { CHART_COLORS } from '../../../../charts/chart-palette';
import { AreaDailyCharts } from '../../../../charts/area-daily-charts/area-daily-charts';
import { TabItem, UiTabs } from '../../../../shared/elements/ui-tabs/ui-tabs';
import { HomeProductionCoordinator } from '../home-production-coordinator/home-production-coordinator';
import { HomeStampingCoordinator } from '../home-stamping-coordinator/home-stamping-coordinator';
import { DashboardSectionState } from '../../../../shared/components/widgets/dashboard-section/dashboard-section';

type AreaKey = 'production' | 'stamping';

interface Load<T> {
  status: 'loading' | 'error' | 'ready';
  data: T | null;
}

interface AreaSource {
  key: AreaKey;
  label: string;
  color: string;
  // Coordinator home that renders the area's cards (same ones the engineer home shows).
  cards: Type<unknown>;
  service: Pick<ModuleProductivityService, 'getModuleEfficiency'>;
}

const loading = <T>(): Load<T> => ({ status: 'loading', data: null });

// Executive view for administrators: one tab per area with its cards and daily charts for
// the current month. Data comes from the same module-efficiency endpoints that feed the coordinator
// homes. To add an area, add an entry to `sources` (and to the `rows` initial state).
@Component({
  selector: 'app-home-admin',
  imports: [NgComponentOutlet, UiTabs, AreaDailyCharts],
  templateUrl: './home-admin.html',
})
export class HomeAdmin {
  private readonly destroyRef = inject(DestroyRef);

  private readonly sources: AreaSource[] = [
    {
      key: 'production',
      label: 'Confección',
      color: CHART_COLORS.brand,
      cards: HomeProductionCoordinator,
      service: inject(ProductivityService),
    },
    {
      key: 'stamping',
      label: 'Estampación',
      color: CHART_COLORS.brand,
      cards: HomeStampingCoordinator,
      service: inject(StampingProductivityService),
    },
  ];

  readonly monthLabel = currentMonthLabel();
  readonly tabs: TabItem[] = this.sources.map(({ key, label }) => ({ key, label }));
  readonly activeTab = signal<AreaKey>('production');

  private readonly rows = signal<Record<AreaKey, Load<ModuleEfficiencyRow[]>>>({
    production: loading(),
    stamping: loading(),
  });

  // Selected area with its rows and the state the charts must render.
  readonly active = computed(() => {
    const source = this.sources.find((s) => s.key === this.activeTab())!;
    const load = this.rows()[source.key];
    const data = load.data ?? [];
    return { ...source, rows: data, state: this.toState(load, data.length) };
  });

  constructor() {
    this.sources.forEach((source) => this.loadArea(source.key));
  }

  onTabChange(key: string): void {
    this.activeTab.set(key as AreaKey);
  }

  loadArea(key: AreaKey): void {
    const source = this.sources.find((s) => s.key === key)!;
    const { startDate, endDate } = currentMonthRange();
    this.fetch(source.service.getModuleEfficiency(startDate, endDate), (load) =>
      this.rows.update((current) => ({ ...current, [key]: load })),
    );
  }

  private fetch<T>(source$: Observable<T>, apply: (load: Load<T>) => void): void {
    apply(loading());
    source$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => apply({ status: 'ready', data }),
      error: () => apply({ status: 'error', data: null }),
    });
  }

  private toState(load: Load<unknown>, itemCount: number): DashboardSectionState {
    if (load.status !== 'ready') return load.status;
    return itemCount ? 'ready' : 'empty';
  }
}
