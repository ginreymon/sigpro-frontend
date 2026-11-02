import { inject, Injectable, signal } from '@angular/core';
import { BehaviorSubject, catchError, forkJoin, map, Observable, of, switchMap, tap } from 'rxjs';
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

  // A page that already fetched the active session (e.g. the shift-cycles entry, to choose which page to
  // mount) hands it over here: the next load() reuses it instead of requesting it again. It is used once
  // and only for a few seconds, so a later load() never gets a stale session.
  private preloaded: { session: ProductionContext['session']; at: number } | null = null;

  preloadSession(session: ProductionContext['session']): void {
    this.preloaded = { session, at: Date.now() };
  }

  private takePreloadedSession(): { session: ProductionContext['session'] } | null {
    const preloaded = this.preloaded;
    this.preloaded = null;
    return preloaded && Date.now() - preloaded.at < 10_000 ? preloaded : null;
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
    loadDocTypes = true,
  ): Observable<ProductionContext> {
    const coreModuleId = this.routeContextService.currentModule?.id;
    const scopeParams = coreModuleId ? { core_module_id: coreModuleId } : undefined;

    const preloaded = this.takePreloadedSession();

    return forkJoin({
      session: preloaded
        ? of(preloaded.session)
        : this.workSessionService.getActive(scopeParams).pipe(catchError(() => of(null))),
      docTypes: loadDocTypes
        ? this.poService.getDocType().pipe(catchError(() => of([])))
        : of([]),
      workBreaks: loadWorkBreaks
        ? this.workBreakService.all().pipe(catchError(() => of([])))
        : of([]),
      employees: loadEmployees
        ? this.employeeService.all(scopeParams).pipe(catchError(() => of([])))
        : of([]),
      workShifts: loadWorkShifts
        ? this.workShiftService.all(scopeParams).pipe(catchError(() => of([])))
        : of([]),
      modules: loadModules
        ? this.moduleService.all(scopeParams).pipe(catchError(() => of([])))
        : of([]),
    }).pipe(
      switchMap(({ session, docTypes, workBreaks, employees, workShifts, modules }) => {
        return this.resolveOrder(session, docType, docNumber, orderLoader).pipe(
          map(order => ({ session, docTypes, workBreaks, employees, workShifts, modules, order }))
        );
      }),
      tap(context => this._context$.next(context))
    );
  }

  // Soft reload, in two independent pieces so the page can update the order as soon as it arrives (the session
  // is not awaited): each one requests only its data and merges it into the current snapshot, keeping docTypes,
  // workBreaks, employees, workShifts and modules. Used after a save, without the skeleton a full load() brings.
  refreshSession(): Observable<ProductionContext['session']> {
    const coreModuleId = this.routeContextService.currentModule?.id;
    const scopeParams = coreModuleId ? { core_module_id: coreModuleId } : undefined;
    return this.workSessionService.getActive(scopeParams).pipe(
      catchError(() => of(null)),
      tap(session => this.updateSession(session)),
    );
  }

  // `session` is the one already in memory: the order loader of some pages reads it (e.g. stamping).
  refreshOrder(
    docType: string,
    docNumber: number,
    session: ProductionContext['session'],
    orderLoader?: (docType: string, docNumber: number, session: ProductionContext['session']) => Observable<ProductionOrder | null>,
  ): Observable<ProductionOrder | null> {
    return this.resolveOrder(session, docType, docNumber, orderLoader).pipe(tap(order => this.updateOrder(order)));
  }

  // Order of the given OP; without one, the OP of the session's open production record. Null on error.
  private resolveOrder(
    session: ProductionContext['session'],
    docType?: string,
    docNumber?: number,
    orderLoader?: (docType: string, docNumber: number, session: ProductionContext['session']) => Observable<ProductionOrder | null>,
  ): Observable<ProductionOrder | null> {
    const record = session?.active_activity?.last_open_production_record;
    const type = docType ?? record?.op_type;
    const number = docNumber ?? record?.op_number;
    if (!type || !number) return of(null);
    return (
      orderLoader
        ? orderLoader(type, number, session)
        : this.poService.getOrder({ documentType: type, documentNumber: number }, true).pipe(
            map(order => order as ProductionOrder),
          )
    ).pipe(catchError(() => of(null)));
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
