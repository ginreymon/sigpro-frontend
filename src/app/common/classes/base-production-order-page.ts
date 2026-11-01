import { Directive, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
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
    if (!current) {
      this.beforeLoad();
      this.loadContext();
      return;
    }
    // Soft reload: the content stays mounted and only the global loader shows (no skeleton); session and
    // order are refreshed in place. loadContext() (skeleton) stays for the first load and for searches.
    this.beforeLoad();
    this.loaderService.showLoader();
    this.contextService
      .refresh(current.documentType, current.documentNumber, this.orderLoader)
      .pipe(finalize(() => this.loaderService.hideLoader()))
      .subscribe({
        next: (context) => {
          this.currentSession.set(context.session);
          this.productionOrder.set(context.order);
          this.onContextLoaded(context);
        },
        error: () => this.onContextError(),
      });
  }

  protected beforeLoad(): void {}
  protected onContextLoaded(context: ProductionContext): void {}
  protected onContextError(): void {}
}
