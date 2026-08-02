import { Component } from '@angular/core';
import { WorkShiftSummary } from '../work-shift-summary/work-shift-summary';
import { UiIcon } from '../../../../elements/ui-icon/ui-icon';
import { UpperCasePipe } from '@angular/common';
import { WorkSession } from '../../../../../models/production/work-session';
import { currentMonthLabel } from '../../../../../common/functions/date-utils';

@Component({
  selector: 'app-home-production-shift-card',
  imports: [UiIcon, UpperCasePipe],
  templateUrl: './home-production-shift-card.html',
})
export class HomeProductionShiftCard extends WorkShiftSummary {
  private readonly monthlyEfficiencyTitle = `Eficiencia ${currentMonthLabel()}`;

  protected override buildCards(s: WorkSession): void {
    super.buildCards(s);
    this.cards.update(cards => [...cards, {
      title: this.monthlyEfficiencyTitle,
      data: '-',
      thresholds: { green: this.appConfig.highEfficiencyLimit, red: this.appConfig.lowEfficiencyLimit },
    }]);
    this.loadMonthlyEfficiency(s);
  }

  private loadMonthlyEfficiency(s: WorkSession): void {
    const moduleId = s.current_module?.id;
    if (!moduleId) return;

    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
    const endDate = now.toISOString().slice(0, 10);

    this.productivityService.getModuleEfficiency(startDate, endDate, moduleId).subscribe({
      next: (rows) => {
        // Días sin registros o en cero no cuentan para el promedio.
        const withData = rows.filter(r => (r.efficiency ?? 0) > 0);
        const avg = withData.length
          ? withData.reduce((sum, r) => sum + r.efficiency, 0) / withData.length
          : 0;
        this.cards.update(cards => cards.map(card =>
          card.title === this.monthlyEfficiencyTitle ? { ...card, data: Math.round(avg * 100) / 100 } : card
        ));
      },
    });
  }
}
