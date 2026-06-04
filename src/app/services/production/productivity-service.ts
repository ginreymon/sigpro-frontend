import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { EfficiencyPeriod } from '../../models/production/efficiency-period';
import { ProductivityParams } from '../../models/production/productivity-params';
import { ProductivitySummaryRow } from '../../models/production/productivity-summary-row';
import { PaginatedResponse } from '../../common/interfaces/paginated-response';

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

  getSummary(p: ProductivityParams): Observable<PaginatedResponse<ProductivitySummaryRow>> {
    let params = new HttpParams()
      .set('start_date', p.startDate)
      .set('end_date', p.endDate)
      .set('client_now', p.clientNow ?? new Date().toISOString());
    if (p.moduleId !== undefined) params = params.set('module_id', p.moduleId);
    if (p.shiftId !== undefined) params = params.set('shift_id', p.shiftId);
    if (p.employeeId !== undefined) params = params.set('employee_id', p.employeeId);

    return this.http.get<ProductivitySummaryRow[]>(`${this.path}/summary/`, { params }).pipe(
      map(results => ({ count: results.length, next: null, previous: null, results }))
    );
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

  exportSummaryExcel(p: ProductivityParams): Observable<Blob> {
    let params = new HttpParams()
      .set('start_date', p.startDate)
      .set('end_date', p.endDate)
      .set('client_now', p.clientNow ?? new Date().toISOString())
      .set('utc_offset_minutes', p.utcOffsetMinutes ?? -new Date().getTimezoneOffset());
    if (p.moduleId !== undefined) params = params.set('module_id', p.moduleId);
    if (p.shiftId !== undefined) params = params.set('shift_id', p.shiftId);
    if (p.employeeId !== undefined) params = params.set('employee_id', p.employeeId);

    return this.http.get(`${this.path}/summary/export/excel/`, { params, responseType: 'blob' });
  }
}
