import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { EfficiencyPeriod } from '../../models/production/efficiency-period';
import { EfficiencyReportRow } from '../../models/production/efficiency-report-row';
import { ProductivityParams } from '../../models/production/productivity-params';
import { ProductivitySummaryRow } from '../../models/production/productivity-summary-row';
import { PaginatedResponse } from '../../common/interfaces/paginated-response';
import { ModuleEfficiencyStatus } from '../../models/production/module-efficiency-status';
import { ModuleEfficiencyRow } from '../../models/production/module-efficiency-row';

export interface EfficiencyReportParams {
  startDate:     string;
  endDate:       string;
  moduleId?:     number;
  shiftId?:      number;
  employeeId?:   number;
  coreModuleId?: number;
}

@Injectable({
  providedIn: 'root',
})
export class ProductivityService {
  private path = `${environment.BASE_API_URL}/production/productivity`;

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

  getShiftSummary(p: ProductivityParams): Observable<PaginatedResponse<ProductivitySummaryRow>> {
    let params = new HttpParams()
      .set('start_date', p.startDate)
      .set('end_date', p.endDate)
      .set('client_now', p.clientNow ?? new Date().toISOString())
      .set('shift_id', p.shiftId!)
      .set('module_id', p.moduleId!);
    if (p.employeeId !== undefined) params = params.set('employee_id', p.employeeId);

    return this.http.get<ProductivitySummaryRow[]>(`${this.path}/shift-summary/`, { params }).pipe(
      map(results => ({ count: results.length, next: null, previous: null, results }))
    );
  }

  getBalanceSummary(p: ProductivityParams): Observable<PaginatedResponse<ProductivitySummaryRow>> {
    let params = new HttpParams()
      .set('start_date', p.startDate)
      .set('end_date', p.endDate)
      .set('client_now', p.clientNow ?? new Date().toISOString());
    if (p.moduleId !== undefined) params = params.set('module_id', p.moduleId);

    return this.http.get<ProductivitySummaryRow[]>(`${this.path}/balance-summary/`, { params }).pipe(
      map(results => ({ count: results.length, next: null, previous: null, results }))
    );
  }

  getModuleShiftSummary(coreModuleId?: number): Observable<ModuleEfficiencyStatus[]> {
    let params = new HttpParams();
    if (coreModuleId !== undefined) params = params.set('core_module_id', coreModuleId);
    return this.http.get<ModuleEfficiencyStatus[]>(`${this.path}/module-shift-summary/`, { params });
  }

  getModuleEfficiency(startDate: string, endDate: string, moduleId?: number): Observable<ModuleEfficiencyRow[]> {
    let params = new HttpParams()
      .set('start_date', startDate)
      .set('end_date', endDate);
    if (moduleId) params = params.set('module_id', moduleId);
    return this.http.get<ModuleEfficiencyRow[]>(`${this.path}/module-efficiency/`, { params });
  }

  getEfficiencyReport(p: EfficiencyReportParams): Observable<EfficiencyReportRow[]> {
    let params = new HttpParams()
      .set('start_date', p.startDate)
      .set('end_date', p.endDate);
    if (p.moduleId     !== undefined) params = params.set('module_id',      p.moduleId);
    if (p.shiftId      !== undefined) params = params.set('shift_id',       p.shiftId);
    if (p.employeeId   !== undefined) params = params.set('employee_id',    p.employeeId);
    if (p.coreModuleId !== undefined) params = params.set('core_module_id', p.coreModuleId);
    return this.http.get<EfficiencyReportRow[]>(`${this.path}/efficiency-report/`, { params });
  }

  downloadEfficiencyReport(p: EfficiencyReportParams): Observable<Blob> {
    let params = new HttpParams()
      .set('start_date', p.startDate)
      .set('end_date', p.endDate);
    if (p.moduleId     !== undefined) params = params.set('module_id',      p.moduleId);
    if (p.shiftId      !== undefined) params = params.set('shift_id',       p.shiftId);
    if (p.employeeId   !== undefined) params = params.set('employee_id',    p.employeeId);
    if (p.coreModuleId !== undefined) params = params.set('core_module_id', p.coreModuleId);
    return this.http.get(`${this.path}/efficiency-report/export/`, { params, responseType: 'blob' });
  }
}
