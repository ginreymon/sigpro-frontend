import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { AppConfigService } from '../../../../../services/core/app-config-service';
import { efficiencyTextColor } from '../../../../../common/functions/efficiency-color';
import { UiIcon } from '../../../../elements/ui-icon/ui-icon';

@Component({
  selector: 'app-efficiency-summary-bar',
  imports: [UiIcon],
  templateUrl: './efficiency-summary-bar.html',
})
export class EfficiencySummaryBar {
  private appConfig = inject(AppConfigService);

  @Input() efficiency = 0;
  @Input() status = 'INACTIVE';
  @Input() completed = 0;
  @Input() activeModules?: number;
  @Input() showFilterButton = false;
  @Input() filterActive = false;
  @Output() filterToggle = new EventEmitter<void>();

  efficiencyColor(): string {
    return efficiencyTextColor(
      this.efficiency,
      this.appConfig.highEfficiencyLimit,
      this.appConfig.lowEfficiencyLimit,
      this.status === 'ACTIVE',
    );
  }

  completedColor(): string {
    return this.status === 'ACTIVE' ? 'text-green-600' : 'text-gray-400';
  }

  modulesColor(): string {
    return (this.activeModules ?? 0) > 0 ? 'text-green-600' : 'text-gray-400';
  }
}
