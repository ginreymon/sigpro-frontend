import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { beforeAll, describe, expect, it } from 'vitest';
import { ModuleEfficiencyRow } from '../../../../models/production/module-efficiency-row';
import { AppConfigService } from '../../../../services/core/app-config-service';
import { ProductivityService } from '../../../../services/production/productivity-service';
import { StampingProductivityService } from '../../../../services/stamping/stamping-productivity-service';
import { HomeAdmin } from './home-admin';

const row = (moduleId: number, efficiency: number) =>
  ({ module_id: moduleId, module_number: moduleId, module_name: `M${moduleId}`, efficiency, shift_start_utc: '2026-10-05T12:00:00Z' }) as ModuleEfficiencyRow;

function setup(production: unknown, stamping: unknown) {
  TestBed.configureTestingModule({
    providers: [
      { provide: ProductivityService, useValue: { getModuleEfficiency: () => production } },
      { provide: StampingProductivityService, useValue: { getModuleEfficiency: () => stamping } },
      { provide: AppConfigService, useValue: { highEfficiencyLimit: 100, lowEfficiencyLimit: 0 } },
    ],
  });
  // Cards come from other homes with their own dependencies; only the tabs and radar matter here.
  TestBed.overrideComponent(HomeAdmin, {
    set: {
      template: `<app-ui-tabs [tabs]="tabs" [activeKey]="activeTab()" (tabChange)="onTabChange($event)"></app-ui-tabs>
        <app-efficiency-radar-chart [title]="'R'" [areaLabel]="active().label" [color]="active().color"
          [labels]="moduleLabels()" [values]="moduleValues()" [target]="appConfig.highEfficiencyLimit" [state]="active().state"></app-efficiency-radar-chart>`,
    },
  });
  const fixture = TestBed.createComponent(HomeAdmin);
  fixture.detectChanges();
  return fixture;
}

const cells = (el: HTMLElement) => Array.from(el.querySelectorAll('tbody th')).map((c) => c.textContent?.trim());

describe('HomeAdmin radar by area', () => {
  beforeAll(() => {
    window.matchMedia ??= (() => ({ matches: false })) as unknown as typeof window.matchMedia;
  });

  it('shows the modules of the selected area and updates on tab change', () => {
    const fixture = setup(of([row(1, 80), row(2, 90), row(3, 70)]), of([row(10, 60), row(11, 65), row(12, 75), row(13, 55)]));
    const el = fixture.nativeElement as HTMLElement;
    expect(cells(el)).toEqual(['M1', 'M2', 'M3']);

    fixture.componentInstance.onTabChange('stamping');
    fixture.detectChanges();
    expect(cells(el)).toEqual(['M10', 'M11', 'M12', 'M13']);
  });

  it('shows the error state only for the area whose request failed', () => {
    const fixture = setup(throwError(() => new Error('x')), of([row(10, 60), row(11, 65), row(12, 75)]));
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('No se pudo cargar la información');

    fixture.componentInstance.onTabChange('stamping');
    fixture.detectChanges();
    expect(el.textContent).not.toContain('No se pudo cargar la información');
    expect(cells(el)).toHaveLength(3);
  });

  it('shows the empty state when an area returns no rows', () => {
    const fixture = setup(of([]), of([]));
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('No hay datos para este período.');
  });
});
