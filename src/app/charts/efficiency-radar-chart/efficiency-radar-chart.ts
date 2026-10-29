import { Component, computed, input, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import {
  DashboardSection,
  DashboardSectionState,
} from '../../shared/components/widgets/dashboard-section/dashboard-section';
import { UiChart } from '../ui-chart/ui-chart';
import { buildEfficiencyBarConfig, buildEfficiencyRadarConfig } from './efficiency-radar-chart.config';

// A radar needs at least 3 axes to form a polygon; with fewer, horizontal bars are shown.
const MIN_AXES = 3;

// Efficiency (%) per module/machine of one area as a radar or horizontal bars, inside a titled
// section with its loading / error / empty states and a screen-reader table with the same values (WCAG 1.1.1).
@Component({
  selector: 'app-efficiency-radar-chart',
  imports: [DecimalPipe, DashboardSection, UiChart],
  templateUrl: './efficiency-radar-chart.html',
})
export class EfficiencyRadarChart {
  readonly title = input.required<string>();
  readonly areaLabel = input.required<string>();
  readonly color = input.required<string>();
  readonly labels = input.required<string[]>();
  // One value per label, in the same order; null when the axis has no data.
  readonly values = input.required<(number | null)[]>();
  // Optional reference ring (e.g. the high-efficiency limit), drawn when not null.
  readonly target = input<number | null>(null);
  readonly targetLabel = input('Meta');
  readonly state = input<DashboardSectionState>('ready');

  // View chosen by the user; the radar is only offered with enough axes.
  protected readonly selectedView = signal<'radar' | 'bars'>('radar');
  protected readonly canShowRadar = computed(() => this.labels().length >= MIN_AXES);
  protected readonly activeView = computed(() => (this.canShowRadar() ? this.selectedView() : 'bars'));
  protected readonly views = [
    { key: 'radar', label: 'Radar' },
    { key: 'bars', label: 'Barras' },
  ] as const;

  protected readonly config = computed(() => {
    const build = this.activeView() === 'radar' ? buildEfficiencyRadarConfig : buildEfficiencyBarConfig;
    return build(
      this.labels(),
      this.values(),
      this.areaLabel(),
      this.color(),
      this.target(),
      this.targetLabel(),
    );
  });
}
