import { TestBed } from '@angular/core/testing';
import { beforeAll, describe, expect, it } from 'vitest';
import { DashboardSectionState } from '../../shared/components/widgets/dashboard-section/dashboard-section';
import { EfficiencyRadarChart } from './efficiency-radar-chart';

function render(labels: string[], values: (number | null)[], state: DashboardSectionState) {
  const fixture = TestBed.createComponent(EfficiencyRadarChart);
  fixture.componentRef.setInput('title', 'Eficiencia por módulo');
  fixture.componentRef.setInput('areaLabel', 'Confección');
  fixture.componentRef.setInput('color', '#180393');
  fixture.componentRef.setInput('labels', labels);
  fixture.componentRef.setInput('values', values);
  fixture.componentRef.setInput('state', state);
  fixture.detectChanges();
  return fixture.nativeElement as HTMLElement;
}

describe('EfficiencyRadarChart states', () => {
  // The test DOM has no matchMedia, which UiChart reads when the chart is drawn.
  beforeAll(() => {
    window.matchMedia ??= (() => ({ matches: false })) as unknown as typeof window.matchMedia;
  });

  it('shows the error message without a retry button', () => {
    const el = render([], [], 'error');
    expect(el.textContent).toContain('No se pudo cargar la información');
    expect(el.querySelector('button')).toBeNull();
  });

  it('shows the loading skeleton and no chart while loading', () => {
    const el = render([], [], 'loading');
    expect(el.querySelector('[role="status"]')).not.toBeNull();
    expect(el.querySelector('canvas')).toBeNull();
  });

  it('shows the default empty message when there are no modules', () => {
    expect(render([], [], 'empty').textContent).toContain('No hay datos para este período.');
  });

  it('shows a specific empty message with fewer than 3 modules', () => {
    const el = render(['M1', 'M2'], [80, 90], 'ready');
    expect(el.textContent).toContain('al menos 3 módulos');
    expect(el.querySelector('canvas')).toBeNull();
  });

  it('renders the accessible table with "No disponible" for missing values', () => {
    const el = render(['M1', 'M2', 'M3'], [80, null, 70.5], 'ready');
    const cells = Array.from(el.querySelectorAll('tbody td')).map((c) => c.textContent?.trim());
    expect(cells).toEqual(['80.00', 'No disponible', '70.50']);
  });
});
