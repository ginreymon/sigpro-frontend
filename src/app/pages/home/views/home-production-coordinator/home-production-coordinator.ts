import { Component, inject } from '@angular/core';
import { HomeProductivityCard } from '../../../../shared/components/production/cards/home-productivity-card/home-productivity-card';
import { ProductivityService } from '../../../../services/production/productivity-service';
import { HomeCoordinatorBase } from '../../../../common/classes/home-coordinator-base';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-home-production-coordinator',
  imports: [HomeProductivityCard],
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
