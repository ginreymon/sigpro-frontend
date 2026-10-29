import { Component, computed, input } from '@angular/core';
import { ModuleEfficiencyRow } from '../../models/production/module-efficiency-row';
import {
  aggregateDailyByModule,
  aggregateDailyCompleted,
  aggregateDailyEfficiency,
} from '../../common/functions/dashboard-aggregate';
import { DashboardSectionState } from '../../shared/components/widgets/dashboard-section/dashboard-section';
import { DailyTrendChart } from '../daily-trend-chart/daily-trend-chart';

// Daily completed quantity and daily efficiency of one area (Confección, Estampación, ...).
// A new area only needs to pass its module-efficiency rows; nothing here is area specific.
@Component({
  selector: 'app-area-daily-charts',
  imports: [DailyTrendChart],
  templateUrl: './area-daily-charts.html',
})
export class AreaDailyCharts {
  readonly areaLabel = input.required<string>();
  readonly color = input.required<string>();
  readonly monthLabel = input.required<string>();
  readonly rows = input.required<ModuleEfficiencyRow[]>();
  readonly state = input<DashboardSectionState>('ready');

  protected readonly dailyCompleted = computed(() => aggregateDailyCompleted(this.rows()));
  protected readonly dailyEfficiency = computed(() => aggregateDailyEfficiency(this.rows()));
  protected readonly completedByModule = computed(() =>
    aggregateDailyByModule(this.rows(), aggregateDailyCompleted),
  );
  protected readonly efficiencyByModule = computed(() =>
    aggregateDailyByModule(this.rows(), aggregateDailyEfficiency),
  );
}
