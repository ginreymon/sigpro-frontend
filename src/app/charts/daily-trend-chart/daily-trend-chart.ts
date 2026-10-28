import { Component, computed, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { DailyPoint } from '../../common/functions/dashboard-aggregate';
import {
  DashboardSection,
  DashboardSectionState,
} from '../../shared/components/widgets/dashboard-section/dashboard-section';
import { UiChart } from '../ui-chart/ui-chart';
import { buildDailyTrendConfig } from './daily-trend-chart.config';

// One value per day as a line chart, inside a titled section with its loading / error /
// empty states and a screen-reader table with the same values (WCAG 1.1.1).
@Component({
  selector: 'app-daily-trend-chart',
  imports: [DecimalPipe, DashboardSection, UiChart],
  templateUrl: './daily-trend-chart.html',
})
export class DailyTrendChart {
  readonly title = input.required<string>();
  readonly seriesLabel = input.required<string>();
  readonly color = input.required<string>();
  readonly points = input.required<DailyPoint[]>();
  readonly yTitle = input.required<string>();
  // DecimalPipe digits info used by the accessible table (e.g. '1.0-0', '1.2-2').
  readonly valueFormat = input('1.0-0');
  readonly state = input<DashboardSectionState>('ready');

  protected readonly config = computed(() =>
    buildDailyTrendConfig(this.points(), this.seriesLabel(), this.color(), this.yTitle()),
  );
}
