import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { UpperCasePipe } from '@angular/common';
import { ProgressBar } from '../../../widgets/progress-bar/progress-bar';
import { AppConfigService } from '../../../../../services/core/app-config-service';
import { efficiencyTextColor } from '../../../../../common/functions/efficiency-color';
import { ModuleEfficiencySummary } from '../../../../../common/interfaces/module-efficiency-summary';

@Component({
  selector: 'app-range-efficiency-card',
  standalone: true,
  imports: [ProgressBar, UpperCasePipe],
  templateUrl: './range-efficiency-card.html',
})
export class RangeEfficiencyCard {
  private appConfig = inject(AppConfigService);

  @Input({ required: true }) summary!: ModuleEfficiencySummary;
  @Output() cardClick = new EventEmitter<ModuleEfficiencySummary>();

  onClick(): void {
    this.cardClick.emit(this.summary);
  }

  padNumber(n: number): string {
    return n.toString().padStart(2, '0');
  }

  efficiencyColor(): string {
    return efficiencyTextColor(
      this.summary.efficiency,
      this.appConfig.highEfficiencyLimit,
      this.appConfig.lowEfficiencyLimit,
    );
  }
}
