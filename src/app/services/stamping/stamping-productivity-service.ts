import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { EfficiencyPeriod } from '../../models/production/efficiency-period';
import { ProductivityParams } from '../../models/production/productivity-params';
import { ModuleEfficiencyStatus } from '../../models/production/module-efficiency-status';
import { ModuleEfficiencyRow } from '../../models/production/module-efficiency-row';
import { StampingProductivitySummaryRow } from '../../models/stamping/stamping-productivity-summary-row';
import { PaginatedResponse } from '../../common/interfaces/paginated-response';

@Injectable({
  providedIn: 'root',
})
export class StampingProductivityService {
  private path = `${environment.BASE_API_URL}/stamping/productivity`;

  constructor(private http: HttpClient) {}

  getEfficiencyPeriod(p: ProductivityParams): Observable<EfficiencyPeriod> {
    let params = new HttpParams()
      .set('start_date', p.startDate)
      .set('end_date', p.endDate)
      .set('client_now', p.clientNow ?? new Date().toISOString());
    if (p.moduleId !== undefined) params = params.set('module_id', p.moduleId);
    if (p.shiftId !== undefined) params = params.set('shift_id', p.shiftId);

    return this.http.get<EfficiencyPeriod>(`${this.path}/efficiency/`, { params });
  }

  getShiftSummary(p: ProductivityParams): Observable<PaginatedResponse<StampingProductivitySummaryRow>> {
    let params = new HttpParams()
      .set('start_date', p.startDate)
      .set('end_date', p.endDate)
      .set('client_now', p.clientNow ?? new Date().toISOString())
      .set('shift_id', p.shiftId!)
      .set('module_id', p.moduleId!);
    if (p.employeeId !== undefined) params = params.set('employee_id', p.employeeId);

    return this.http.get<StampingProductivitySummaryRow[]>(`${this.path}/shift-summary/`, { params }).pipe(
      map(results => ({ count: results.length, next: null, previous: null, results }))
    );
  }

  getBalanceSummary(p: ProductivityParams): Observable<PaginatedResponse<StampingProductivitySummaryRow>> {
    let params = new HttpParams()
      .set('start_date', p.startDate)
      .set('end_date', p.endDate)
      .set('client_now', p.clientNow ?? new Date().toISOString());
    if (p.moduleId !== undefined) params = params.set('module_id', p.moduleId);

    return this.http.get<StampingProductivitySummaryRow[]>(`${this.path}/balance-summary/`, { params }).pipe(
      map(results => ({ count: results.length, next: null, previous: null, results }))
    );
  }

  // moduleId: the backend computes only that module (faster); without it, all the modules.
  getModuleShiftSummary(coreModuleId?: number, moduleId?: number): Observable<ModuleEfficiencyStatus[]> {
    let params = new HttpParams();
    if (coreModuleId !== undefined) params = params.set('core_module_id', coreModuleId);
    if (moduleId !== undefined) params = params.set('module_id', moduleId);
    return this.http.get<ModuleEfficiencyStatus[]>(`${this.path}/module-shift-summary/`, { params });
  }

  getModuleEfficiency(startDate: string, endDate: string, moduleId?: number): Observable<ModuleEfficiencyRow[]> {
    let params = new HttpParams()
      .set('start_date', startDate)
      .set('end_date', endDate);
    if (moduleId) params = params.set('module_id', moduleId);
    return this.http.get<ModuleEfficiencyRow[]>(`${this.path}/module-efficiency/`, { params });
  }
}
