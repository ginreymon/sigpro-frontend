import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Location } from '@angular/common';
import { WorkSpaceLayout } from '../../../layouts/work-space-layout/work-space-layout';
import { UiTabs, TabItem } from '../../../shared/elements/ui-tabs/ui-tabs';
import { UiIcon } from '../../../shared/elements/ui-icon/ui-icon';
import { OrderHeader } from '../../../shared/components/production/cards/order-header/order-header';
import { ProductionOrdersTable } from '../../../shared/components/production/tables/production-orders-table/production-orders-table';
import { OrderSearcher } from '../../../shared/components/production/widgets/order-searcher/order-searcher';
import { BaseProductionOrderPage } from '../../../common/classes/base-production-order-page';
import { ProductionOrder } from '../../../models/production/production-order';
import { UiButton } from '../../../shared/elements/ui-button/ui-button';
import { ShiftNavigationService } from '../../../services/core/shift-navigation-service';

const TABS: TabItem[] = [
  { key: 'tab1', label: 'Orden OP' },
  { key: 'tab2', label: 'Auditoría' },
];

@Component({
  selector: 'app-stamping-auditory',
  imports: [WorkSpaceLayout, UiTabs, UiIcon, OrderHeader, ProductionOrdersTable, OrderSearcher, UiButton],
  templateUrl: './auditory.html',
})
export class StampingAuditory extends BaseProductionOrderPage {
  protected override loadExtras = false;

  private shiftNav = inject(ShiftNavigationService);
  private location = inject(Location);

  private context = toSignal(this.contextService.context$, { initialValue: null });
  contextDocTypes = computed(() => this.context()?.docTypes ?? []);

  activeTab = signal('tab1');
  tabs = TABS;

  protected override beforeLoad(): void {
    this.activeTab.set('tab1');
  }

  onTabChange(key: string): void {
    this.activeTab.set(key);
  }

  goToSearch(): void {
    this.productionOrder.set(null);
  }

  override setDocument(doc: ProductionOrder | null): void {
    this.productionOrder.set(doc);
    if (!doc) return;
    const tree = this.router.createUrlTree([], {
      queryParams: { docType: doc.documentType, docNumber: doc.documentNumber },
      queryParamsHandling: 'merge',
    });
    this.location.replaceState(this.router.serializeUrl(tree));
  }

  goToShiftCycles(): void {
    const order = this.productionOrder();
    if (order) {
      this.shiftNav.goToShiftCycles({ docType: order.documentType, docNumber: order.documentNumber });
    } else {
      this.goToDayOperation();
    }
  }

  goToDayOperation() {
    this.shiftNav.goToDayOperation();
  }
}
