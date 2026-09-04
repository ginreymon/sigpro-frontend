import { Directive, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize, Observable } from 'rxjs';
import { WorkSpaceLoaderService } from '../../services/common/work-space-loader-service';
import { LoaderService } from '../../services/common/loader-service';
import { ProductionContextService } from '../../services/production/production-context-service';
import { ProductionContext } from '../../models/production/production-context';
import { ProductionOrder } from '../../models/production/production-order';
import { WorkSession } from '../../models/production/work-session';

@Directive()
export abstract class BaseProductionOrderPage implements OnInit {
  protected router = inject(Router);
  protected route = inject(ActivatedRoute);
  protected wslService = inject(WorkSpaceLoaderService);
  protected loaderService = inject(LoaderService);
  protected contextService = inject(ProductionContextService);

  isLoading = signal(true);
  productionOrder = signal<ProductionOrder | null>(null);
  currentSession = signal<WorkSession | null>(null);

  protected loadExtras = true;
  // Subclases pueden reemplazar cómo se resuelve la orden (ej. el
  // shift-cycles de estampación la trae de stamping-orders/detail, que ya
  // incluye todo lo que production-orders/detail tiene, en un solo viaje).
  protected orderLoader?: (docType: string, docNumber: number, session: WorkSession | null) => Observable<ProductionOrder | null>;

  ngOnInit(): void {
    this.loadDocumentFromRoute();
  }

  protected loadDocumentFromRoute(): void {
    this.productionOrder.set(null);
    this.route.queryParams.subscribe(({ docType, docNumber }) => {
      this.beforeLoad();
      if (!docType || !docNumber) this.productionOrder.set(null);
      this.loadContext(docType || undefined, docNumber ? +docNumber : undefined);
    });
  }

  protected loadContext(docType?: string, docNumber?: number): void {
    this.isLoading.set(true);
    this.wslService.start();
    this.loaderService.showLoader();
    this.contextService
      .load(docType, docNumber, this.loadExtras, this.loadExtras, this.loadExtras, this.loadExtras, this.orderLoader)
      .pipe(finalize(() => {
        this.isLoading.set(false);
        this.wslService.end();
        this.loaderService.hideLoader();
      }))
      .subscribe({
        next: (context) => {
          this.currentSession.set(context.session);
          this.setDocument(context.order);
          this.onContextLoaded(context);
        },
        error: () => this.onContextError(),
      });
  }

  setDocument(doc: ProductionOrder | null): void {
    this.productionOrder.set(doc);
    if (!doc) return;
    this.router.navigate([], {
      queryParams: { docType: doc.documentType, docNumber: doc.documentNumber },
      queryParamsHandling: 'merge',
    });
  }

  reloadOrder(): void {
    this.productionOrder.set(null);
    this.beforeLoad();
    const { docType, docNumber } = this.route.snapshot.queryParams;
    this.loadContext(docType || undefined, docNumber ? +docNumber : undefined);
  }

  protected beforeLoad(): void {}
  protected onContextLoaded(context: ProductionContext): void {}
  protected onContextError(): void {}
}
