import { Component, inject } from '@angular/core';
import { EfficiencySummaryBar } from '../../../../shared/components/production/widgets/efficiency-summary-bar/efficiency-summary-bar';
import { ProductivityService } from '../../../../services/production/productivity-service';
import { HomeCoordinatorBase } from '../../../../common/classes/home-coordinator-base';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-home-production-coordinator',
  imports: [EfficiencySummaryBar],
  templateUrl: './home-production-coordinator.html',
})
export class HomeProductionCoordinator extends HomeCoordinatorBase {
  protected readonly productivityService = inject(ProductivityService);

  constructor() {
    super();
    this.initCoordinator();
  }

  goToPanel(): void {
    this.router.navigateByUrl(environment.MODULE_PANEL_URL);
  }
}
