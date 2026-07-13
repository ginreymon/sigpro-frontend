import { Component, signal } from '@angular/core';
import { WorkSpaceLayout } from '../../../layouts/work-space-layout/work-space-layout';
import { UiTabs, TabItem } from '../../../shared/elements/ui-tabs/ui-tabs';
import { UiIcon } from '../../../shared/elements/ui-icon/ui-icon';
import { OrderHeader } from '../../../shared/components/production/cards/order-header/order-header';
import { ProductionOrdersTable } from '../../../shared/components/production/tables/production-orders-table/production-orders-table';
import { BaseProductionOrderPage } from '../../../common/classes/base-production-order-page';
import { UiButton } from '../../../shared/elements/ui-button/ui-button';
import { SewingSamTable } from '../../../shared/components/production/tables/sewing-sam-table/sewing-sam-table';
import { MaterialsTable } from '../../../shared/components/production/tables/materials-table/materials-table';
import { environment } from '../../../../environments/environment';
import { UnplannedShiftMessage } from "../../../layouts/messages/unplanned-shift-message/unplanned-shift-message";

const ALL_TABS: TabItem[] = [
  { key: 'tab1', label: 'Orden OP' },
  { key: 'tab2', label: 'Materiales' },
  { key: 'tab3', label: 'SAM Confección' },
];
const SAM_TABS: TabItem[] = [{ key: 'tab3', label: 'SAM Confección' }];

@Component({
  selector: 'app-order-detail',
  imports: [WorkSpaceLayout, UiTabs, UiIcon, OrderHeader, ProductionOrdersTable, UiButton, SewingSamTable, MaterialsTable, UnplannedShiftMessage],
  templateUrl: './order-detail.html',
  styleUrl: './order-detail.css',
})
export class OrderDetail extends BaseProductionOrderPage {
  protected override loadExtras = false;

  private get hasParams(): boolean {
    const { docType, docNumber } = this.route.snapshot.queryParams;
    return !!(docType && docNumber);
  }

  activeTab = signal(this.hasParams ? 'tab1' : 'tab3');
  tabs      = signal<TabItem[]>(this.hasParams ? ALL_TABS : SAM_TABS);

  protected override beforeLoad(): void {
    const { docType, docNumber } = this.route.snapshot.queryParams;
    if (docType && docNumber) {
      this.tabs.set(ALL_TABS);
      this.activeTab.set('tab1');
    } else {
      this.tabs.set(SAM_TABS);
      this.activeTab.set('tab3');
    }
  }

  onTabChange(key: string): void {
    this.activeTab.set(key);
  }

  goToShiftCycles(): void {
    const { docType, docNumber } = this.route.snapshot.queryParams;
    if (docType && docNumber) {
      this.router.navigate(['/', ...environment.SHIFT_CYCLES_URL.split('/')], {
        queryParams: { docType, docNumber },
      });
    } else {
      this.goToDayOperation();
    }
  }

  goToDayOperation() {
    this.router.navigate(['/', ...environment.DAY_OPERATION_URL.split('/')]);
  }
}
