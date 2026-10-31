import { Component, computed } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { BaseProductionOrderPage } from '../../../../common/classes/base-production-order-page';
import { OrderSearcher } from '../../../../shared/components/production/widgets/order-searcher/order-searcher';
import { OrderHeader } from '../../../../shared/components/production/cards/order-header/order-header';
import { ProductionOrdersTable } from '../../../../shared/components/production/tables/production-orders-table/production-orders-table';

// Read-only view of a production order for administrators; it does not depend on an open work session.
@Component({
  selector: 'app-view-order',
  imports: [OrderSearcher, OrderHeader, ProductionOrdersTable],
  templateUrl: './view-order.html',
})
export class ViewOrder extends BaseProductionOrderPage {
  protected override loadExtras = false;

  private context = toSignal(this.contextService.context$, { initialValue: null });
  protected contextDocTypes = computed(() => this.context()?.docTypes ?? []);
}
