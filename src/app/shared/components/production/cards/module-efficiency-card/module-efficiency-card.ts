import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ProgressBar } from '../../../widgets/progress-bar/progress-bar';
import { ModuleEfficiencyStatus } from '../../../../../models/production/module-efficiency-status';
import { EfficiencyCardFrame } from '../efficiency-card-frame/efficiency-card-frame';

const BAR_COLORS: Record<string, string> = {
  completed: '#16a34a',
  rejected:  '#f59e0b',
  scrap:     '#ef4444',
};

type StatType = 'completed' | 'rejected' | 'scrap';

@Component({
  selector: 'app-module-efficiency-card',
  standalone: true,
  imports: [ProgressBar, EfficiencyCardFrame],
  templateUrl: './module-efficiency-card.html',
})
export class ModuleEfficiencyCard {
  @Input({ required: true }) mod!: ModuleEfficiencyStatus;
  @Input() emptyLabel?: string;
  @Output() cardClick = new EventEmitter<ModuleEfficiencyStatus>();

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
}
