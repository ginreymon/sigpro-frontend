import { inject, Injectable, signal } from '@angular/core';
import { BehaviorSubject, catchError, forkJoin, map, Observable, of, Subject, switchMap, take, tap, timeout } from 'rxjs';
import { ProductionContext } from '../../models/production/production-context';
import { ProductionOrder } from '../../models/production/production-order';
import { EfficiencyPeriod } from '../../models/production/efficiency-period';
import { WorkSessionService } from './work-session-service';
import { ProductionOrderService } from './production-order-service';
import { WorkBreakService } from './work-break-service';
import { EmployeeService } from './employee-service';
import { WorkShiftService } from './work-shift-service';
import { ModuleService } from './module-service';
import { RouteContextService } from '../core/route-context-service';

@Injectable({ providedIn: 'root' })
export class ProductionContextService {

  private workSessionService = inject(WorkSessionService);
  private poService = inject(ProductionOrderService);
  private workBreakService = inject(WorkBreakService);
  private employeeService = inject(EmployeeService);
  private workShiftService = inject(WorkShiftService);
  private moduleService = inject(ModuleService);
  private routeContextService = inject(RouteContextService);

  private _context$ = new BehaviorSubject<ProductionContext | null>(null);
  context$ = this._context$.asObservable();

  readonly efficiencyPeriod = signal<EfficiencyPeriod | null>(null);

  setEfficiency(data: EfficiencyPeriod): void {
    this.efficiencyPeriod.set(data);
  }

  // Session already fetched by the shift-cycles entry; consumed once by the next load() so the
  // same work-sessions/active request is not sent twice.
  private prefetchedSession: { value: ProductionContext['session'] } | null = null;

  prefetchSession(session: ProductionContext['session']): void {
    this.prefetchedSession = { value: session };
  }

  // Bumped after a record is saved: summary cards watching it refresh their numbers in place.
  readonly summaryRefresh = signal(0);
  private summaryRefreshed$ = new Subject<void>();

  // Asks the summary cards to refresh; the returned observable completes when they have finished
  // (the timeout keeps a page without a mounted card from waiting forever).
  requestSummaryRefresh(): Observable<void> {
    const done$ = this.summaryRefreshed$.pipe(take(1), timeout({ first: 15000, with: () => of(undefined) }));
    this.summaryRefresh.update((n) => n + 1);
    return done$;
  }

  notifySummaryRefreshed(): void {
    this.summaryRefreshed$.next();
  }

  // Resolves one order with the page's own loader (or the generic production-orders/detail).
  fetchOrder(
    docType: string,
    docNumber: number,
    session: ProductionContext['session'],
    orderLoader?: (docType: string, docNumber: number, session: ProductionContext['session']) => Observable<ProductionOrder | null>,
  ): Observable<ProductionOrder | null> {
    return (
      orderLoader
        ? orderLoader(docType, docNumber, session)
        : this.poService.getOrder({ documentType: docType, documentNumber: docNumber }, true).pipe(
            map((order) => order as ProductionOrder),
          )
    ).pipe(catchError(() => of(null)));
  }

  get snapshot(): ProductionContext | null {
    return this._context$.value;
  }

  load(
    docType?: string,
    docNumber?: number,
    loadWorkBreaks = true,
    loadEmployees = true,
    loadWorkShifts = true,
    loadModules = true,
    // Por defecto resuelve la orden vía production-orders/detail. Páginas
    // como el shift-cycles de estampación pueden pasar un loader propio
    // (ej. stamping-orders/detail, que ya trae colorRows + referenceSams en
    // un solo viaje) para no tener que pegarle también al endpoint genérico.
    orderLoader?: (docType: string, docNumber: number, session: ProductionContext['session']) => Observable<ProductionOrder | null>,
    // Reuse the catalogs of the current snapshot instead of requesting them again (used to refresh
    // only the session and the order after a save).
    reuseCatalogs = false,
  ): Observable<ProductionContext> {
    const cached = reuseCatalogs ? this.snapshot : null;
    const prefetched = this.prefetchedSession;
    this.prefetchedSession = null;
    const coreModuleId = this.routeContextService.currentModule?.id;
    const scopeParams = coreModuleId ? { core_module_id: coreModuleId } : undefined;

    return forkJoin({
      session: prefetched
        ? of(prefetched.value)
        : this.workSessionService.getActive(scopeParams).pipe(catchError(() => of(null))),
      // Document types only feed the order searcher. When the OP comes defined (URL params) the
      // searcher is hidden; if it appears later (e.g. "search another order") it loads them itself.
      docTypes: cached
        ? of(cached.docTypes)
        : docType && docNumber
          ? of([])
          : this.poService.getDocType().pipe(catchError(() => of([]))),
      workBreaks: cached
        ? of(cached.workBreaks)
        : loadWorkBreaks
        ? this.workBreakService.all().pipe(catchError(() => of([])))
        : of([]),
      employees: cached
        ? of(cached.employees)
        : loadEmployees
        ? this.employeeService.all(scopeParams).pipe(catchError(() => of([])))
        : of([]),
      workShifts: cached
        ? of(cached.workShifts)
        : loadWorkShifts
        ? this.workShiftService.all(scopeParams).pipe(catchError(() => of([])))
        : of([]),
      modules: cached
        ? of(cached.modules)
        : loadModules
        ? this.moduleService.all(scopeParams).pipe(catchError(() => of([])))
        : of([]),
    }).pipe(
      switchMap(({ session, docTypes, workBreaks, employees, workShifts, modules }) => {
        const record = session?.active_activity?.last_open_production_record;
        const type = docType ?? record?.op_type;
        const number = docNumber ?? record?.op_number;

        const order$ = type && number ? this.fetchOrder(type, number, session, orderLoader) : of(null);

        return order$.pipe(
          map(order => ({ session, docTypes, workBreaks, employees, workShifts, modules, order }))
        );
      }),
      tap(context => this._context$.next(context))
    );
  }

  updateSession(session: ProductionContext['session']): void {
    const ctx = this._context$.value;
    if (!ctx) return;
    this._context$.next({ ...ctx, session });
  }

  updateOrder(order: ProductionOrder | null): void {
    const ctx = this._context$.value;
    if (!ctx) return;
    this._context$.next({ ...ctx, order });
  }

  clear(): void {
    this._context$.next(null);
  }
}
