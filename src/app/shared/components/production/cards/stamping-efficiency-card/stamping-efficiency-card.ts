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

const COMPLETED_COLOR = '#16a34a';

@Component({
  selector: 'app-stamping-efficiency-card',
  standalone: true,
  imports: [UiBadge, ProgressBar, UpperCasePipe],
  templateUrl: './stamping-efficiency-card.html',
})
export class StampingEfficiencyCard {
  private appConfig = inject(AppConfigService);

  @Input({ required: true }) mod!: ModuleEfficiencyStatus;
  @Input() emptyLabel?: string;
  @Output() cardClick = new EventEmitter<ModuleEfficiencyStatus>();

  onClick(): void {
    this.cardClick.emit(this.mod);
  }

  padNumber(n: number): string {
    return n.toString().padStart(2, '0');
  }

  formatLastWorkedDate(): string {
    if (!this.mod.last_worked_date) return '';
    const [year, month, day] = this.mod.last_worked_date.split('-');
    return `${day}/${month}/${year.slice(2)}`;
  }

  statusLabel(): string {
    return STATUS_LABELS[this.mod.status] ?? this.mod.status;
  }

  badgeIntent(): BadgeIntent {
    return STATUS_INTENTS[this.mod.status] ?? 'inactive';
  }

  barColor(): string {
    return this.mod.status === 'ACTIVE' ? COMPLETED_COLOR : '#9ca3af';
  }

  statValueClass(): string {
    return this.mod.status === 'ACTIVE' ? 'font-medium text-green-600' : 'font-medium text-gray-400';
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
