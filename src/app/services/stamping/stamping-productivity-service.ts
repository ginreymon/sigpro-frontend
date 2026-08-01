import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { EfficiencyPeriod } from '../../models/production/efficiency-period';
import { ProductivityParams } from '../../models/production/productivity-params';
import { ModuleEfficiencyStatus } from '../../models/production/module-efficiency-status';
import { ModuleEfficiencyRow } from '../../models/production/module-efficiency-row';

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
}
