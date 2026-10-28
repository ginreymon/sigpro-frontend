import { Component, input } from '@angular/core';

export type DashboardSectionState = 'loading' | 'error' | 'empty' | 'ready';

// Titled box that renders loading / error / empty states and projects the content when ready.
@Component({
  selector: 'app-dashboard-section',
  templateUrl: './dashboard-section.html',
})
export class DashboardSection {
  readonly title = input.required<string>();
  readonly state = input<DashboardSectionState>('ready');
  readonly emptyMessage = input('No hay datos para este período.');
}
