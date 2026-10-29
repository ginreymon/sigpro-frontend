import { Component, computed, input, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { DailyPoint, ModuleDailySeries } from '../../common/functions/dashboard-aggregate';
import {
  DashboardSection,
  DashboardSectionState,
} from '../../shared/components/widgets/dashboard-section/dashboard-section';
import { UiChart } from '../ui-chart/ui-chart';
import { buildDailyTrendConfig, moduleSeriesStyle } from './daily-trend-chart.config';

// One value per day as a line chart (plus an optional line per module), inside a titled section with its loading / error /
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

  // Optional one line per module, drawn under the area line; the user chooses which are shown.
  readonly series = input<ModuleDailySeries[]>([]);

  // Modules the user hid; everything is visible by default.
  private readonly hiddenIds = signal<ReadonlySet<number>>(new Set());

  protected readonly chips = computed(() =>
    this.series().map((series, index) => ({
      series,
      index,
      color: moduleSeriesStyle(index).color,
      visible: !this.hiddenIds().has(series.moduleId),
    })),
  );

  protected readonly config = computed(() =>
    buildDailyTrendConfig(
      this.points(),
      this.seriesLabel(),
      this.color(),
      this.yTitle(),
      this.chips().filter((c) => c.visible),
      this.series().length > 0,
    ),
  );

  protected toggle(moduleId: number): void {
    this.hiddenIds.update((ids) => {
      const next = new Set(ids);
      if (!next.delete(moduleId)) next.add(moduleId);
      return next;
    });
  }

  protected showAll(): void {
    this.hiddenIds.set(new Set());
  }

  protected hideAll(): void {
    this.hiddenIds.set(new Set(this.series().map((s) => s.moduleId)));
  }

  protected valueOn(series: ModuleDailySeries, date: string): number | null {
    return series.points.find((p) => p.date === date)?.value ?? null;
  }
}
