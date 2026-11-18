import { Directive, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { finalize, forkJoin, Observable } from 'rxjs';
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
  protected location = inject(Location);
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

  protected loadContext(docType?: string, docNumber?: number, reuseCatalogs = false): void {
    this.isLoading.set(true);
    this.wslService.start();
    this.loaderService.showLoader();
    this.contextService
      // work-shifts and modules are never read from the context by these pages, so they are not requested.
      .load(docType, docNumber, this.loadExtras, this.loadExtras, false, false, this.orderLoader, reuseCatalogs)
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
    // El searcher resuelve la OP fuera de loadContext(), así que hay que
    // reflejarla también en el snapshot de contexto — si no, queda
    // desactualizada ahí y todo lo que lee contextService.snapshot?.order
    // (ej. StampingRecordDataService, para la pestaña Referencia) sigue
    // viendo la OP anterior tras una búsqueda dentro de la página.
    this.contextService.updateOrder(doc);
    if (!doc) return;
    // replaceState en vez de router.navigate: solo sincroniza la URL (para
    // que quede bookmarkeable/recargable), sin volver a emitir en
    // route.queryParams — router.navigate sí lo hace, y como
    // loadDocumentFromRoute está suscrito a ese observable, disparaba un
    // loadContext() completo (session, docTypes, workBreaks, employees,
    // workShifts, modules y la orden otra vez) inmediatamente después de que
    // el buscador ya había resuelto la orden, duplicando todas esas llamadas.
    const tree = this.router.createUrlTree([], {
      queryParams: { docType: doc.documentType, docNumber: doc.documentNumber },
      queryParamsHandling: 'merge',
    });
    this.location.replaceState(this.router.serializeUrl(tree));
  }

  reloadOrder(): void {
    // Se lee de productionOrder(), no de route.snapshot.queryParams: desde
    // que setDocument usa Location.replaceState (ver comentario ahí), la URL
    // se actualiza por fuera del Router, así que el snapshot de la ruta
    // queda desactualizado tras una búsqueda — la orden actual en memoria es
    // la única fuente confiable.
    const current = this.productionOrder();
    this.productionOrder.set(null);
    this.beforeLoad();
    // Catalogs do not change when a record is saved: refresh only the session and the order.
    this.loadContext(current?.documentType, current?.documentNumber, true);
  }

  private refreshingAfterSave = false;

  private refreshDoneCallbacks: Array<() => void> = [];

  // Refresh after a record is saved: re-fetches only the order and the shift summary and updates
  // them in place (no skeleton, page not rebuilt). `onDone` runs once both have finished and the
  // components are updated, whether they succeeded or not (used to hide the loader).
  refreshAfterSave(onDone?: () => void): void {
    if (onDone) this.refreshDoneCallbacks.push(onDone);
    const current = this.productionOrder();
    if (!current) {
      // No OP in memory: the full reload runs its own loader, so pending callbacks are dropped.
      this.refreshDoneCallbacks = [];
      this.reloadOrder();
      return;
    }
    if (this.refreshingAfterSave) return;
    this.refreshingAfterSave = true;
    forkJoin({
      order: this.contextService.fetchOrder(current.documentType, current.documentNumber, this.currentSession(), this.orderLoader),
      summary: this.contextService.requestSummaryRefresh(),
    })
      .pipe(
        finalize(() => {
          this.refreshingAfterSave = false;
          this.flushRefreshCallbacks();
        }),
      )
      .subscribe(({ order }) => {
        if (order) this.setDocument(order);
      });
  }

  private flushRefreshCallbacks(): void {
    const callbacks = this.refreshDoneCallbacks;
    this.refreshDoneCallbacks = [];
    callbacks.forEach((cb) => cb());
  }

  protected beforeLoad(): void {}
  protected onContextLoaded(context: ProductionContext): void {}
  protected onContextError(): void {}
}
