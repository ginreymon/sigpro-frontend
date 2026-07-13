import { Component, computed, inject } from '@angular/core';
import { environment } from '../../../../../../environments/environment';
import { toSignal } from '@angular/core/rxjs-interop';
import { UpperCasePipe } from '@angular/common';
import { Router } from '@angular/router';
import { ProductionContextService } from '../../../../../services/production/production-context-service';
import { AppConfigService } from '../../../../../services/core/app-config-service';
import { UiTooltip } from '../../../../elements/ui-tooltip/ui-tooltip';
import { efficiencyTextColor } from '../../../../../common/functions/efficiency-color';

interface InfoCard {
  title: string;
  display: string;
  numericValue: number | null;
  thresholds: { green: number; red: number } | null;
  tooltip?: string;
  action?: () => void;
}

@Component({
  selector: 'app-order-info-bar',
  standalone: true,
  imports: [UpperCasePipe, UiTooltip],
  templateUrl: './order-info-bar.html',
})
export class OrderInfoBar {
  private contextService = inject(ProductionContextService);
  private appConfig = inject(AppConfigService);
  private router = inject(Router);

  private context = toSignal(this.contextService.context$, { initialValue: null });

  protected cards = computed(() => {
    const order = this.context()?.order;
    if (!order) return [] as InfoCard[];

    const efficiency = this.contextService.efficiencyPeriod();
    const effRaw = efficiency != null ? Math.round(efficiency.efficiency * 100) / 100 : null;
    const accumulated = efficiency?.total_completed ?? null;

    return [
      {
        title: 'OP',
        display: `${order.documentType} ${order.documentNumber}`,
        numericValue: null,
        thresholds: null,
        tooltip: 'Cambiar OP',
        action: () => this.goToSearch(),
      },
      {
        title: 'Referencia',
        display: order.reference,
        numericValue: null,
        thresholds: null,
        tooltip: 'Materiales / SAM',
        action: () => this.showMaterials(order.documentType, order.documentNumber),
      },
      { title: 'Acumuladas', display: accumulated != null ? `${accumulated}` : '-', numericValue: accumulated, thresholds: { green: 0, red: Infinity } },
      { title: 'Eficiencia', display: effRaw != null ? `${effRaw}%` : '-', numericValue: effRaw, thresholds: { green: this.appConfig.highEfficiencyLimit, red: this.appConfig.lowEfficiencyLimit } },
    ] as InfoCard[];
  });

  private showMaterials(docType: string, docNumber: number): void {
    this.router.navigate(['/', ...environment.ORDER_DETAIL.split('/')], {
      queryParams: { docType, docNumber },
    });
  }

  private goToSearch(): void {
    this.router.navigate([], { queryParams: {} });
  }

  protected getDataClass(card: InfoCard): string {
    if (card.thresholds && card.numericValue != null) {
      const color = efficiencyTextColor(card.numericValue, card.thresholds.green, card.thresholds.red);
      return `text-sm font-semibold ${color}`;
    }
    return 'text-sm font-semibold text-slate-900';
  }
}
