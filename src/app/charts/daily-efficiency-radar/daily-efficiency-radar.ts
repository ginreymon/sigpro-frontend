import { Component, computed, input } from '@angular/core';
import { ModuleEfficiencyPoint } from '../../common/functions/dashboard-aggregate';
import { DashboardSectionState } from '../../shared/components/widgets/dashboard-section/dashboard-section';
import { EfficiencyRadarChart } from '../efficiency-radar-chart/efficiency-radar-chart';

// Efficiency (%) of one local day per module/machine of an area. Thin wrapper over the monthly
// radar: it only builds the title with the queried date and splits the points into axes/values.
@Component({
  selector: 'app-daily-efficiency-radar',
  imports: [EfficiencyRadarChart],
  template: `
    <app-efficiency-radar-chart
      [title]="title()"
      [areaLabel]="areaLabel()"
      [color]="color()"
      [labels]="labels()"
      [values]="values()"
      [target]="target()"
      [targetLabel]="targetLabel()"
      [state]="state()">
    </app-efficiency-radar-chart>
  `,
})
export class DailyEfficiencyRadar {
  // One point per module/machine; a null value means "no data", not 0 %.
  readonly points = input.required<ModuleEfficiencyPoint[]>();
  // Queried local day, YYYY-MM-DD.
  readonly date = input.required<string>();
  readonly areaLabel = input.required<string>();
  readonly color = input.required<string>();
  readonly target = input<number | null>(null);
  readonly targetLabel = input('Meta');
  readonly state = input<DashboardSectionState>('ready');

  protected readonly title = computed(() => {
    const [year, month, day] = this.date().split('-').map(Number);
    // Built from the parts (local time) so the day never shifts through UTC.
    const label = new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium' }).format(
      new Date(year, month - 1, day),
    );
    return `Eficiencia de hoy por módulo · ${label}`;
  });
  protected readonly labels = computed(() => this.points().map((p) => p.label));
  protected readonly values = computed(() => this.points().map((p) => p.value));
}
