import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ProgressBar } from '../../../widgets/progress-bar/progress-bar';
import { ModuleEfficiencyStatus } from '../../../../../models/production/module-efficiency-status';
import { EfficiencyCardFrame } from '../efficiency-card-frame/efficiency-card-frame';

const COMPLETED_COLOR = '#16a34a';

@Component({
  selector: 'app-stamping-efficiency-card',
  standalone: true,
  imports: [ProgressBar, EfficiencyCardFrame],
  templateUrl: './stamping-efficiency-card.html',
})
export class StampingEfficiencyCard {
  @Input({ required: true }) mod!: ModuleEfficiencyStatus;
  @Input() emptyLabel?: string;
  @Output() cardClick = new EventEmitter<ModuleEfficiencyStatus>();

  formatLastWorkedDate(): string {
    if (!this.mod.last_worked_date) return '';
    const [year, month, day] = this.mod.last_worked_date.split('-');
    return `${day}/${month}/${year.slice(2)}`;
  }

  barColor(): string {
    return this.mod.status === 'ACTIVE' ? COMPLETED_COLOR : '#9ca3af';
  }

  statValueClass(): string {
    return this.mod.status === 'ACTIVE' ? 'font-medium text-green-600' : 'font-medium text-gray-400';
  }
}
