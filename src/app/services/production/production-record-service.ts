import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpParams } from '@angular/common/http';
import { BaseCrudService } from '../common/base-crud-service';
import { ProductionRecord } from '../../models/production/production-record';

@Injectable({
  providedIn: 'root',
})
export class ProductionRecordService extends BaseCrudService<ProductionRecord> {
  protected override _endpoint: string = '/production/production-records/';

  getRecent(limit?: number): Observable<ProductionRecord[]> {
    const params = limit ? new HttpParams().set('limit', limit) : undefined;
    return this.http.get<ProductionRecord[]>(`${this.endpoint}recent/`, { params });
  }

  // Variante de create() para módulos con allows_manual_duration_entry=true:
  // el backend calcula start_time/end_time a partir de duration_seconds.
  createManual(data: Partial<ProductionRecord>): Observable<ProductionRecord> {
    return this.http.post<ProductionRecord>(`${this.endpoint}manual-duration/`, data);
  }
}
