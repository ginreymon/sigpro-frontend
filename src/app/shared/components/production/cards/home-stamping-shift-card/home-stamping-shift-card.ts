import { Component, inject, signal } from '@angular/core';
import { UpperCasePipe } from '@angular/common';
import { finalize } from 'rxjs';
import { StampingShiftSummary } from '../stamping-shift-summary/stamping-shift-summary';
import { UiIcon } from '../../../../elements/ui-icon/ui-icon';
import { WorkSession } from '../../../../../models/production/work-session';
import { WorkShiftCard } from '../../../../../common/interfaces/work-shift-card';
import { StampingProductivityService } from '../../../../../services/stamping/stamping-productivity-service';
import { currentMonthLabel } from '../../../../../common/functions/date-utils';

@Component({
  selector: 'app-home-stamping-shift-card',
  imports: [UiIcon, UpperCasePipe],
  templateUrl: './home-stamping-shift-card.html',
})
export class HomeStampingShiftCard extends StampingShiftSummary {
  private stampingMonthlyService = inject(StampingProductivityService);
  private readonly monthlyEfficiencyTitle = `Eficiencia ${currentMonthLabel()}`;
  // Eficiencia del mes depende de su propia llamada HTTP (loadMonthlyEfficiency),
  // no de getModuleSummary() — summaryLoading (heredado) no la cubre, así que
  // necesita su propio flag para el skeleton mientras está en vuelo.
  private monthlyEfficiencyLoading = signal(true);

  protected override buildCards(s: WorkSession): void {
    super.buildCards(s);
    this.monthlyEfficiencyLoading.set(true);
    this.cards.update(cards => [...cards, {
      title: this.monthlyEfficiencyTitle,
      data: '-',
      thresholds: { green: this.appConfig.highEfficiencyLimit, red: this.appConfig.lowEfficiencyLimit },
    }]);
    this.loadMonthlyEfficiency(s);
  }

  override isSummaryLoadingCard(card: WorkShiftCard): boolean {
    if (card.title === this.monthlyEfficiencyTitle) return this.monthlyEfficiencyLoading();
    return super.isSummaryLoadingCard(card);
  }

  private loadMonthlyEfficiency(s: WorkSession): void {
    const moduleId = s.current_module?.id;
    if (!moduleId) {
      this.monthlyEfficiencyLoading.set(false);
      return;
    }

    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
    const endDate = now.toISOString().slice(0, 10);

    this.stampingMonthlyService.getModuleEfficiency(startDate, endDate, moduleId)
      .pipe(finalize(() => this.monthlyEfficiencyLoading.set(false)))
      .subscribe({
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
