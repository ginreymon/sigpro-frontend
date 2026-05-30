import { Component, computed, effect, signal } from '@angular/core';
import { WorkSpaceLayout } from '../../../layouts/work-space-layout/work-space-layout';
import { UiTabs, TabItem } from '../../../shared/elements/ui-tabs/ui-tabs';
import { UiIcon } from '../../../shared/elements/ui-icon/ui-icon';
import { OrderHeader } from '../../../shared/elements/order-header/order-header';
import { ProductionOrdersTable } from '../../../shared/elements/production-orders-table/production-orders-table';
import { BaseProductionOrderPage } from '../../../common/classes/base-production-order-page';
import { UiButton } from "../../../shared/elements/ui-button/ui-button";
import { SewingSamTable } from '../../../shared/elements/sewing-sam-table/sewing-sam-table';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-order-detail',
  imports: [WorkSpaceLayout, UiTabs, UiIcon, OrderHeader, ProductionOrdersTable, UiButton, SewingSamTable],
  templateUrl: './order-detail.html',
  styleUrl: './order-detail.css',
})
export class OrderDetail extends BaseProductionOrderPage {

  protected override loadExtras = false;

  activeTab = signal('tab1');

  tabs = computed<TabItem[]>(() =>
    this.productionOrder()
      ? [
          { key: 'tab1', label: 'Orden OP' },
          { key: 'tab2', label: 'Materiales' },
          { key: 'tab3', label: 'SAM Confección' },
        ]
      : [{ key: 'tab3', label: 'SAM Confección' }]
  );

  private _tabReset = effect(() => {
    this.activeTab.set(this.productionOrder() ? 'tab1' : 'tab3');
  });

  goToShiftCycles(): void {
    const { docType, docNumber } = this.route.snapshot.queryParams;
    if (docType && docNumber) {
      this.router.navigate(['/', ...environment.SHIFT_CYCLES_URL.split('/')], {
        queryParams: { docType, docNumber },
      });
    } else {
      this.router.navigate(['/', ...environment.DAY_OPERATION_URL.split('/')]);
    }
  }
}
