import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { interval, of } from 'rxjs';
import { catchError, startWith, switchMap } from 'rxjs/operators';
import { ModuleDetailBottomSheet } from '../../../shared/components/module-detail-bottom-sheet/module-detail-bottom-sheet';
import { ProgressBar } from '../../../shared/components/progress-bar/progress-bar';
import { UiBadge, BadgeIntent } from '../../../shared/elements/ui-badge/ui-badge';
import { ProductivityService } from '../../../services/production/productivity-service';
import { ModuleEfficiencyStatus } from '../../../models/production/module-efficiency-status';
import { UpperCasePipe } from '@angular/common';
import { AppConfigService } from '../../../services/core/app-config-service';

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
  imports: [ModuleDetailBottomSheet, ProgressBar, UiBadge, UpperCasePipe],
  templateUrl: './module-panel.html',
})
export class ModulePanel {
  private productivityService = inject(ProductivityService);
  private destroyRef = inject(DestroyRef);
  private appConfig = inject(AppConfigService);

  selectedModule = signal<ModuleEfficiencyStatus | null>(null);
  sheetVisible = signal(false);
  readonly modules = signal<ModuleEfficiencyStatus[]>([]);

  constructor() {
    interval(30_000).pipe(
      startWith(0),
      switchMap(() => this.productivityService.getModuleShiftSummary().pipe(
        catchError(() => of([] as ModuleEfficiencyStatus[])),
      )),
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
    if (status !== 'ACTIVE') return 'text-4xl font-semibold text-gray-400';
    if (efficiency >= this.appConfig.highEfficiencyLimit) return 'text-4xl font-semibold text-green-600';
    if (efficiency <= this.appConfig.lowEfficiencyLimit)  return 'text-4xl font-semibold text-red-600';
    return 'text-4xl font-semibold text-amber-500';
  }
}
