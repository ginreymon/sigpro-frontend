import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, catchError, forkJoin, map, Observable, of, switchMap, tap } from 'rxjs';
import { ProductionContext } from '../../models/production/production-context';
import { ProductionOrder } from '../../models/production/production-order';
import { WorkSessionService } from './work-session-service';
import { ProductionOrderService } from './production-order-service';
import { WorkBreakService } from './work-break-service';
import { EmployeeService } from './employee-service';
import { WorkShiftService } from './work-shift-service';

@Injectable({ providedIn: 'root' })
export class ProductionContextService {

  private workSessionService = inject(WorkSessionService);
  private poService = inject(ProductionOrderService);
  private workBreakService = inject(WorkBreakService);
  private employeeService = inject(EmployeeService);
  private workShiftService = inject(WorkShiftService);

  private _context$ = new BehaviorSubject<ProductionContext | null>(null);
  context$ = this._context$.asObservable();

  get snapshot(): ProductionContext | null {
    return this._context$.value;
  }

  load(docType?: string, docNumber?: number, loadWorkBreaks = true, loadEmployees = true, loadWorkShifts = true): Observable<ProductionContext> {
    return forkJoin({
      session: this.workSessionService.getActive().pipe(catchError(() => of(null))),
      docTypes: this.poService.getDocType().pipe(catchError(() => of([]))),
      workBreaks: loadWorkBreaks
        ? this.workBreakService.getAll().pipe(map((r: any) => r.results ?? r), catchError(() => of([])))
        : of([]),
      employees: loadEmployees
        ? this.employeeService.getAll().pipe(map((r: any) => r.results ?? r), catchError(() => of([])))
        : of([]),
      workShifts: loadWorkShifts
        ? this.workShiftService.getAll().pipe(map((r: any) => r.results ?? r), catchError(() => of([])))
        : of([]),
    }).pipe(
      switchMap(({ session, docTypes, workBreaks, employees, workShifts }) => {
        const record = session?.active_activity?.last_open_production_record;
        const type = docType ?? record?.op_type;
        const number = docNumber ?? record?.op_number;

        const order$ = type && number
          ? this.poService.getOrder({ documentType: type, documentNumber: number }, true).pipe(
              map(order => order as ProductionOrder),
              catchError(() => of(null))
            )
          : of(null);

        return order$.pipe(
          map(order => ({ session, docTypes, workBreaks, employees, workShifts, order }))
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
