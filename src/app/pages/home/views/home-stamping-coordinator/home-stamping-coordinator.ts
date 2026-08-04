import { Component, inject } from '@angular/core';
import { EfficiencySummaryBar } from '../../../../shared/components/production/widgets/efficiency-summary-bar/efficiency-summary-bar';
import { StampingProductivityService } from '../../../../services/stamping/stamping-productivity-service';
import { HomeCoordinatorBase } from '../../../../common/classes/home-coordinator-base';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-home-stamping-coordinator',
  imports: [EfficiencySummaryBar],
  templateUrl: './home-stamping-coordinator.html',
})
export class HomeStampingCoordinator extends HomeCoordinatorBase {
  protected readonly productivityService = inject(StampingProductivityService);

  constructor() {
    super();
    this.initCoordinator();
  }

  goToPanel(): void {
    this.router.navigateByUrl(environment.MACHINE_PANEL_URL);
  }
}
