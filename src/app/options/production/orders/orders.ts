import { Component, inject, signal } from '@angular/core';
import { ProductionOrdersTable } from '../../../shared/elements/production-orders-table/production-orders-table';
import { Searcher } from '../../../shared/components/searcher/searcher';
import { ProductionOrderService } from '../../../services/production/production-order-service';
import { DocType } from '../../../models/production/doc-type';
import { WorkSpaceLayout } from '../../../layouts/work-space-layout/work-space-layout';
import { WorkSessionService } from '../../../services/production/work-session-service';
import { WorkSession } from '../../../models/production/work-session';
import { Router } from '@angular/router';
import { WorkSpaceLoaderService } from '../../../services/common/work-space-loader-service';
import { finalize } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { OrderSearcher } from '../../../shared/components/order-searcher/order-searcher';

@Component({
  selector: 'app-orders',
  imports: [WorkSpaceLayout, FormsModule, OrderSearcher],
  templateUrl: './orders.html',
  styleUrl: './orders.css',
})
export class Orders {
  private DAY_OPERATION_URL: string = 'production/day-operation';

  doctypes = signal<DocType[]>([]);
  currentSession = signal<WorkSession | null>(null);
  poService = inject(ProductionOrderService);
  router = inject(Router);
  wslService = inject(WorkSpaceLoaderService);

  constructor(private workSessionService: WorkSessionService) {
    this.initialize();
  }

  initialize() {
    this.wslService.start();
    this.workSessionService
      .getActive()
      .pipe(finalize(() => this.wslService.end()))
      .subscribe({
        next: (session) => {
          this.currentSession.set(session);
          if (!session) {
            this.router.navigateByUrl(this.DAY_OPERATION_URL);
          }
        },
        error: () => this.currentSession.set(null),
      });
  }
}
