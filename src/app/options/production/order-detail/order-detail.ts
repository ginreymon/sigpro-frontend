import { Component, inject, signal } from '@angular/core';
import { WorkSpaceLayout } from '../../../layouts/work-space-layout/work-space-layout';
import { UiTabs, TabItem } from '../../../shared/elements/ui-tabs/ui-tabs';
import { UiIcon } from '../../../shared/elements/ui-icon/ui-icon';
import { OrderHeader } from '../../../shared/components/production/cards/order-header/order-header';
import { ProductionOrdersTable } from '../../../shared/components/production/tables/production-orders-table/production-orders-table';
import { BaseProductionOrderPage } from '../../../common/classes/base-production-order-page';
import { UiButton } from '../../../shared/elements/ui-button/ui-button';
import { MaterialsTable } from '../../../shared/components/production/tables/materials-table/materials-table';
import { InfoCardTemplate } from "../../../template/info-card-template/info-card-template";
import { ShiftNavigationService } from '../../../services/core/shift-navigation-service';
import { SamGoalCalculator } from '../../../shared/components/production/widgets/sam-goal-calculator/sam-goal-calculator';

const TABS: TabItem[] = [
  { key: 'tab1', label: 'Orden OP' },
  { key: 'tab2', label: 'Materiales' },
  { key: 'tab3', label: 'SAM Confección' },
];

@Component({
  selector: 'app-order-detail',
  imports: [WorkSpaceLayout, UiTabs, UiIcon, OrderHeader, ProductionOrdersTable, UiButton, MaterialsTable, InfoCardTemplate, SamGoalCalculator],
  templateUrl: './order-detail.html',
  styleUrl: './order-detail.css',
})
export class OrderDetail extends BaseProductionOrderPage {
  protected override loadExtras = false;

  private shiftNav = inject(ShiftNavigationService);

  activeTab = signal('tab1');
  tabs = TABS;

  protected override beforeLoad(): void {
    this.activeTab.set('tab1');
  }

  onTabChange(key: string): void {
    this.activeTab.set(key);
  }

  goToShiftCycles(): void {
    const { docType, docNumber } = this.route.snapshot.queryParams;
    if (docType && docNumber) {
      this.shiftNav.goToShiftCycles({ docType, docNumber });
    } else {
      this.goToDayOperation();
    }
  }

  goToDayOperation() {
    this.shiftNav.goToDayOperation();
  }
}
