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
import { EfficiencyRadarChart } from '../../../../charts/efficiency-radar-chart/efficiency-radar-chart';
import { aggregateEfficiencyByModule } from '../../../../common/functions/dashboard-aggregate';
import { AppConfigService } from '../../../../services/core/app-config-service';
import { TabItem, UiTabs } from '../../../../shared/elements/ui-tabs/ui-tabs';
import { HomeProductionCoordinator } from '../home-production-coordinator/home-production-coordinator';
import { HomeStampingCoordinator } from '../home-stamping-coordinator/home-stamping-coordinator';
import { OpProgressRow } from '../../../../models/common/op-progress-row';
import { OpProgressService } from '../../../../services/common/op-progress-service';
import {
  OpProgressAreaOption,
  OpProgressByModule,
  OpProgressFilters,
} from '../../../../shared/components/widgets/op-progress-by-module/op-progress-by-module';
import { DashboardSectionState } from '../../../../shared/components/widgets/dashboard-section/dashboard-section';

type AreaKey = 'production' | 'stamping';
type TabKey = AreaKey | typeof OP_TAB_KEY;

interface Load<T> {
  status: 'loading' | 'error' | 'ready';
  data: T | null;
}

interface AreaSource {
  key: AreaKey;
  // production_production_area.id, sent as `area_id` to the OP progress endpoint.
  areaId: number;
  label: string;
  color: string;
  // Coordinator home that renders the area's cards (same ones the engineer home shows).
  cards: Type<unknown>;
  service: Pick<ModuleProductivityService, 'getModuleEfficiency'>;
}

// Last tab: OP progress of every area, filtered by area and date range on the server.
const OP_TAB_KEY = 'ops';

const loading = <T>(): Load<T> => ({ status: 'loading', data: null });

// Executive view for administrators: one tab per area with its cards and daily charts for
// the current month. Data comes from the same module-efficiency endpoints that feed the coordinator
// homes. To add an area, add an entry to `sources` (and to the `rows` initial state).
@Component({
  selector: 'app-home-admin',
  imports: [NgComponentOutlet, UiTabs, AreaDailyCharts, EfficiencyRadarChart, OpProgressByModule],
  templateUrl: './home-admin.html',
})
export class HomeAdmin {
  private readonly destroyRef = inject(DestroyRef);

  private readonly sources: AreaSource[] = [
    {
      key: 'production',
      areaId: 1,
      label: 'Confección',
      color: CHART_COLORS.brand,
      cards: HomeProductionCoordinator,
      service: inject(ProductivityService),
    },
    {
      key: 'stamping',
      areaId: 2,
      label: 'Estampación',
      color: CHART_COLORS.brand,
      cards: HomeStampingCoordinator,
      service: inject(StampingProductivityService),
    },
  ];

  readonly monthLabel = currentMonthLabel();
  readonly tabs: TabItem[] = [
    ...this.sources.map(({ key, label }) => ({ key, label })),
    { key: OP_TAB_KEY, label: 'Órdenes' },
  ];
  readonly activeTab = signal<TabKey>('production');
  protected readonly isOpTab = computed(() => this.activeTab() === OP_TAB_KEY);

  private readonly rows = signal<Record<AreaKey, Load<ModuleEfficiencyRow[]>>>({
    production: loading(),
    stamping: loading(),
  });

  // OP progress filters; area and dates are applied by the endpoint (current month by default).
  protected readonly opAreaOptions: OpProgressAreaOption[] = this.sources.map(
    ({ areaId, label }) => ({ id: areaId, label }),
  );
  protected readonly opFilters = signal<OpProgressFilters>({
    areaId: null,
    ...currentMonthRange(),
  });
  private readonly opProgressLoad = signal<Load<OpProgressRow[]>>(loading());
  private readonly opProgressService = inject(OpProgressService);
  protected readonly opProgress = computed(() => {
    const load = this.opProgressLoad();
    const data = load.data ?? [];
    return { rows: data, state: this.toState(load, data.length) };
  });

  // Selected area with its rows and the state the charts must render.
  readonly active = computed(() => {
    // The OP tab shows no area charts, so keep the last area selected for the computeds below.
    const source = this.sources.find((s) => s.key === this.lastAreaKey())!;
    const load = this.rows()[source.key];
    const data = load.data ?? [];
    return { ...source, rows: data, state: this.toState(load, data.length) };
  });

  // One radar axis per module of the selected area; the area is implied by the endpoint used.
  protected readonly modulePoints = computed(() => aggregateEfficiencyByModule(this.active().rows));
  protected readonly moduleLabels = computed(() => this.modulePoints().map((p) => p.label));
  protected readonly moduleValues = computed(() => this.modulePoints().map((p) => p.value));
  // Read lazily in the template: the limit is an app setting that may load after this view.
  protected readonly appConfig = inject(AppConfigService);

  constructor() {
    this.sources.forEach((source) => this.loadArea(source.key));
    this.loadOpProgress();
  }

  // Area whose charts are rendered; stays on the previous area while the OP tab is open.
  private readonly lastAreaKey = signal<AreaKey>('production');

  onTabChange(key: string): void {
    this.activeTab.set(key as TabKey);
    if (key !== OP_TAB_KEY) this.lastAreaKey.set(key as AreaKey);
  }

  onOpFiltersChange(filters: OpProgressFilters): void {
    this.opFilters.set(filters);
    this.loadOpProgress();
  }

  loadArea(key: AreaKey): void {
    const source = this.sources.find((s) => s.key === key)!;
    const { startDate, endDate } = currentMonthRange();
    this.fetch(source.service.getModuleEfficiency(startDate, endDate), (load) =>
      this.rows.update((current) => ({ ...current, [key]: load })),
    );
  }

  loadOpProgress(): void {
    const { areaId, startDate, endDate } = this.opFilters();
    this.fetch(this.opProgressService.getOpProgress(startDate, endDate, areaId ?? undefined), (load) =>
      this.opProgressLoad.set(load),
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
