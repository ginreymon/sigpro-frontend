import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { UpperCasePipe } from '@angular/common';
import { UiBadge, BadgeIntent } from '../../../../elements/ui-badge/ui-badge';
import { ProgressBar } from '../../../widgets/progress-bar/progress-bar';
import { ModuleEfficiencyStatus } from '../../../../../models/production/module-efficiency-status';
import { AppConfigService } from '../../../../../services/core/app-config-service';
import { efficiencyTextColor } from '../../../../../common/functions/efficiency-color';

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

const BAR_COLORS: Record<string, string> = {
  completed: '#16a34a',
  rejected:  '#f59e0b',
  scrap:     '#ef4444',
};

type StatType = 'completed' | 'rejected' | 'scrap';

@Component({
  selector: 'app-module-efficiency-card',
  standalone: true,
  imports: [UiBadge, ProgressBar, UpperCasePipe],
  templateUrl: './module-efficiency-card.html',
})
export class ModuleEfficiencyCard {
  private appConfig = inject(AppConfigService);

  @Input({ required: true }) mod!: ModuleEfficiencyStatus;
  @Output() cardClick = new EventEmitter<ModuleEfficiencyStatus>();

  onClick(): void {
    this.cardClick.emit(this.mod);
  }

  padNumber(n: number): string {
    return n.toString().padStart(2, '0');
  }

  statusLabel(): string {
    return STATUS_LABELS[this.mod.status] ?? this.mod.status;
  }

  badgeIntent(): BadgeIntent {
    return STATUS_INTENTS[this.mod.status] ?? 'inactive';
  }

  barColor(type: StatType): string {
    return this.mod.status === 'ACTIVE' ? BAR_COLORS[type] : '#9ca3af';
  }

  statValueClass(type: StatType): string {
    if (this.mod.status !== 'ACTIVE') return 'font-medium text-gray-400';
    const map: Record<StatType, string> = {
      completed: 'font-medium text-green-600',
      rejected:  'font-medium text-amber-500',
      scrap:     'font-medium text-red-500',
    };
    return map[type];
  }

  titleClass(activeColorClass: string): string {
    return this.mod.status === 'ACTIVE' ? activeColorClass : 'text-gray-400';
  }

  efficiencyClass(): string {
    return `text-4xl font-semibold ${this.efficiencyColor()}`;
  }

  efficiencyColor(): string {
    return efficiencyTextColor(
      this.mod.efficiency,
      this.appConfig.highEfficiencyLimit,
      this.appConfig.lowEfficiencyLimit,
      this.mod.status === 'ACTIVE',
    );
  }
}
