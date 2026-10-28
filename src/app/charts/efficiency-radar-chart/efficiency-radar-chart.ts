import { Component, computed, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import {
  DashboardSection,
  DashboardSectionState,
} from '../../shared/components/widgets/dashboard-section/dashboard-section';
import { UiChart } from '../ui-chart/ui-chart';
import { buildEfficiencyRadarConfig } from './efficiency-radar-chart.config';

// A radar needs at least 3 axes to form a polygon.
const MIN_AXES = 3;

// Efficiency (%) per module/machine of one area, inside a titled section with its loading /
// error / empty states and a screen-reader table with the same values (WCAG 1.1.1).
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

  protected readonly tooFewAxes = computed(
    () => this.labels().length > 0 && this.labels().length < MIN_AXES,
  );
  protected readonly effectiveState = computed<DashboardSectionState>(() =>
    this.state() === 'ready' && this.tooFewAxes() ? 'empty' : this.state(),
  );
  protected readonly emptyMessage = computed(() =>
    this.tooFewAxes()
      ? `El radar necesita al menos ${MIN_AXES} módulos con datos.`
      : 'No hay datos para este período.',
  );
  protected readonly config = computed(() =>
    buildEfficiencyRadarConfig(
      this.labels(),
      this.values(),
      this.areaLabel(),
      this.color(),
      this.target(),
      this.targetLabel(),
    ),
  );
}
