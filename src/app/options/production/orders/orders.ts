import { Component, inject, OnInit, signal } from '@angular/core';
import { ProductionOrdersTable } from '../../../shared/elements/production-orders-table/production-orders-table';
import { ProductionOrderService } from '../../../services/production/production-order-service';
import { WorkSpaceLayout } from '../../../layouts/work-space-layout/work-space-layout';
import { WorkSessionService } from '../../../services/production/work-session-service';
import { WorkSession } from '../../../models/production/work-session';
import { ActivatedRoute, Router } from '@angular/router';
import { WorkSpaceLoaderService } from '../../../services/common/work-space-loader-service';
import { finalize } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { OrderSearcher } from '../../../shared/components/order-searcher/order-searcher';
import { ProductionOrder } from '../../../models/production/production-order';
import { UiButton } from '../../../shared/elements/ui-button/ui-button';
import { UpperCasePipe } from '@angular/common';
import { UiIcon } from '../../../shared/elements/ui-icon/ui-icon';

@Component({
  selector: 'app-orders',
  imports: [
    WorkSpaceLayout,
    FormsModule,
    OrderSearcher,
    ProductionOrdersTable,
    UiButton,
    UpperCasePipe,
    UiIcon,
  ],
  templateUrl: './orders.html',
  styleUrl: './orders.css',
})
export class Orders implements OnInit {
  private DAY_OPERATION_URL: string = 'production/day-operation';
  private OPERATION_ORDER_URL: string = 'production/orders';

  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private poService = inject(ProductionOrderService);
  private wslService = inject(WorkSpaceLoaderService);

  currentSession = signal<WorkSession | null>(null);
  productionOrder = signal<ProductionOrder | null>(null);
  cards = signal<{ title: string; data: any }[]>([]);

  constructor(private workSessionService: WorkSessionService) {
  }

  ngOnInit(): void {
    this.loadDocumentFromRoute();
    this.loadSession();
  }

  get document() {
    const doc = this.productionOrder();
    if (!doc) return '';
    return `${doc.documentType} ${doc.documentNumber}`;
  }

  private loadDocumentFromRoute() {
    this.route.queryParams.subscribe(({ docType, docNumber }) => {
      if (docType && docNumber) {
        this.resetDocument(docType, docNumber);
      } else {
        this.setDocument(null);
      }
    });
  }

  private loadSession() {
    this.wslService.start();
    this.workSessionService
      .getActive()
      .pipe(finalize(() => this.wslService.end()))
      .subscribe({
        next: (session) => this.currentSession.set(session ? session : null),
        error: () => this.router.navigateByUrl(this.DAY_OPERATION_URL),
      });
  }

  private resetDocument(documentType: any, documentNumber: any) {
    this.wslService.start();
    const payload: Partial<ProductionOrder> = { documentType, documentNumber };
    this.poService
      .getOrder(payload, true)
      .pipe(finalize(() => this.wslService.end()))
      .subscribe((doc) => {
        this.setDocument(doc as ProductionOrder);
      });
  }

  setDocument(doc: ProductionOrder | null) {
    this.productionOrder.set(doc);
    this.cards.set([]);
    if (!doc) return;

    this.router.navigate([], {
      queryParams: {
        docType: doc.documentType,
        docNumber: doc.documentNumber,
      },
      queryParamsHandling: 'merge',
    });

    this.cards.set([
      { title: 'OP', data: `${doc.documentType} ${doc.documentNumber}` },
      { title: 'Referencia', data: doc.reference },
      { title: 'Tipo de Confección', data: doc.classification.manufacture },
      { title: 'Tipo de Estampación', data: doc.classification.print },
      { title: 'Marca/Línea', data: `${doc.classification.brand}/${doc.classification.line}` },
      { title: 'Clasifi. Comercial', data: doc.classification.commercial },
    ]);
  }

  reloadOrder() {
    const order = this.productionOrder();
    if (order) this.resetDocument(order.documentType, order.documentNumber);
    this.loadSession();
  }

  goToSearch() {
    this.productionOrder.set(null);
    this.router.navigateByUrl(this.OPERATION_ORDER_URL);
  }

  goToDayOperation() {
    this.router.navigateByUrl(this.DAY_OPERATION_URL);
  }
}
