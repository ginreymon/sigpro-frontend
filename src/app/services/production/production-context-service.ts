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
    orderLoader?: (docType: string, docNumber: number) => Observable<ProductionOrder | null>,
  ): Observable<ProductionContext> {
    const coreModuleId = this.routeContextService.currentModule?.id;
    const scopeParams = coreModuleId ? { core_module_id: coreModuleId } : undefined;

    return forkJoin({
      session: this.workSessionService.getActive(scopeParams).pipe(catchError(() => of(null))),
      docTypes: this.poService.getDocType().pipe(catchError(() => of([]))),
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
        const record = session?.active_activity?.last_open_production_record;
        const type = docType ?? record?.op_type;
        const number = docNumber ?? record?.op_number;

        const order$ = type && number
          ? (
              orderLoader
                ? orderLoader(type, number)
                : this.poService.getOrder({ documentType: type, documentNumber: number }, true).pipe(
                    map(order => order as ProductionOrder),
                  )
            ).pipe(catchError(() => of(null)))
          : of(null);

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
