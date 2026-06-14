import { Component, DestroyRef, inject, signal, computed } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { interval, of } from 'rxjs';
import { catchError, finalize, startWith, switchMap, take } from 'rxjs/operators';
import { ModuleDetailBottomSheet } from '../../../shared/components/module-detail-bottom-sheet/module-detail-bottom-sheet';
import { ProgressBar } from '../../../shared/components/progress-bar/progress-bar';
import { UiBadge, BadgeIntent } from '../../../shared/elements/ui-badge/ui-badge';
import { UiIcon } from '../../../shared/elements/ui-icon/ui-icon';
import { ProductivityService } from '../../../services/production/productivity-service';
import { ModuleEfficiencyStatus } from '../../../models/production/module-efficiency-status';
import { UpperCasePipe } from '@angular/common';
import { AppConfigService } from '../../../services/core/app-config-service';
import { efficiencyTextColor } from '../../../common/functions/efficiency-color';
import { computePlantaStats } from '../../../common/functions/planta-summary';
import { LoaderService } from '../../../services/common/loader-service';
import { EfficiencySummaryBar } from '../../../shared/elements/efficiency-summary-bar/efficiency-summary-bar';

const STATUS_LABELS: Record<string, string> = {
  ACTIVE:   'Activo',
  INACTIVE: 'Inactivo',
  PAUSED:   'Pausado',
  DISABLED: 'Inactivo',
};

const STATUS_INTENTS: Record<string, BadgeIntent> = {
  ACTIVE:   'default',
  INACTIVE: 'inactive',
  PAUSED:   'paused',
  DISABLED: 'disabled',
};

@Component({
  selector: 'app-module-panel',
  imports: [ModuleDetailBottomSheet, ProgressBar, UiBadge, UiIcon, UpperCasePipe, EfficiencySummaryBar],
  templateUrl: './module-panel.html',
})
export class ModulePanel {
  private productivityService = inject(ProductivityService);
  private loaderService = inject(LoaderService);
  private destroyRef = inject(DestroyRef);
  private appConfig = inject(AppConfigService);

  selectedModule = signal<ModuleEfficiencyStatus | null>(null);
  sheetVisible = signal(false);
  readonly modules = signal<ModuleEfficiencyStatus[]>([]);

  readonly plantaModule = computed<ModuleEfficiencyStatus>(() => {
    const mods = this.modules();
    const { active, paused, relevant, status, efficiency } = computePlantaStats(mods);
    const ref = active[0] ?? paused[0] ?? mods[0];

    return {
      module_id: 0,
      number: 0,
      name: 'PLANTA',
      location: ref?.location ?? '',
      module_enabled: true,
      work_shift_id: 0,
      work_session_id: 0,
      work_session_activity_id: 0,
      start_time: '',
      work_shift_start_utc: '',
      started_at: '',
      is_active: active.length ? 1 : 0,
      is_pause: 0,
      status,
      period_start: '',
      period_end: '',
      shift_id: 0,
      efficiency,
      operator_count:     relevant.reduce((s, m) => s + (m.operator_count     ?? 0), 0),
      employees_snapshot: relevant.reduce((s, m) => s + (m.employees_snapshot ?? 0), 0),
      total_completed:    relevant.reduce((s, m) => s + (m.total_completed    ?? 0), 0),
      total_rejected:     relevant.reduce((s, m) => s + (m.total_rejected     ?? 0), 0),
      total_scrap:        relevant.reduce((s, m) => s + (m.total_scrap        ?? 0), 0),
      unit_target:        relevant.reduce((s, m) => s + (m.unit_target        ?? 0), 0),
      total_ordered:      relevant.reduce((s, m) => s + (m.total_ordered      ?? 0), 0),
      total_planned:      relevant.reduce((s, m) => s + (m.total_planned      ?? 0), 0),
      total_produced:     relevant.reduce((s, m) => s + (m.total_produced     ?? 0), 0),
    };
  });

  readonly activeModuleCount = computed(() =>
    this.modules().filter((m) => m.status === 'ACTIVE').length,
  );

  readonly allModules = computed<ModuleEfficiencyStatus[]>(() =>
    this.modules().length ? [this.plantaModule(), ...this.modules()] : [],
  );

  constructor() {
    this.appConfig.load().pipe(
      take(1),
      switchMap(() => interval(30_000).pipe(startWith(0))),
      switchMap((_, index) => {
        if (index === 0) this.loaderService.showLoader();
        return this.productivityService.getModuleShiftSummary().pipe(
          catchError(() => of([] as ModuleEfficiencyStatus[])),
          finalize(() => this.loaderService.hideLoader()),
        );
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(data => this.modules.set(data));
  }

  openSheet(mod: ModuleEfficiencyStatus): void {
    this.selectedModule.set(mod);
    this.sheetVisible.set(true);
  }

  closeSheet(): void {
    this.sheetVisible.set(false);
  }

  statusLabel(status: string): string {
    return STATUS_LABELS[status] ?? status;
  }

  badgeIntent(status: string): BadgeIntent {
    return STATUS_INTENTS[status] ?? 'inactive';
  }

  padNumber(n: number): string {
    return n.toString().padStart(2, '0');
  }

  private readonly _barColors: Record<string, string> = {
    completed: '#16a34a',
    rejected:  '#f59e0b',
    scrap:     '#ef4444',
  };

  barColor(type: 'completed' | 'rejected' | 'scrap', status: string): string {
    return status === 'ACTIVE' ? this._barColors[type] : '#9ca3af';
  }

  statValueClass(type: 'completed' | 'rejected' | 'scrap', status: string): string {
    if (status !== 'ACTIVE') return 'font-medium text-gray-400';
    const map: Record<string, string> = {
      completed: 'font-medium text-green-600',
      rejected:  'font-medium text-amber-500',
      scrap:     'font-medium text-red-500',
    };
    return map[type];
  }

  efficiencyClass(efficiency: number, status: string): string {
    return `text-4xl font-semibold ${this.efficiencyColor(efficiency, status)}`;
  }

  efficiencyColor(efficiency: number, status: string): string {
    return efficiencyTextColor(
      efficiency,
      this.appConfig.highEfficiencyLimit,
      this.appConfig.lowEfficiencyLimit,
      status === 'ACTIVE',
    );
  }
}
