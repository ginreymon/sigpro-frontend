import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { UpperCasePipe } from '@angular/common';
import { UiBadge, BadgeIntent } from '../../../../elements/ui-badge/ui-badge';
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

@Component({
  selector: 'app-efficiency-card-frame',
  standalone: true,
  imports: [UiBadge, UpperCasePipe],
  templateUrl: './efficiency-card-frame.html',
})
export class EfficiencyCardFrame {
  private appConfig = inject(AppConfigService);

  @Input({ required: true }) mod!: ModuleEfficiencyStatus;
  @Input({ required: true }) unitLabel!: string;
  @Input({ required: true }) displayName!: string;
  @Input() emptyLabel?: string;
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
