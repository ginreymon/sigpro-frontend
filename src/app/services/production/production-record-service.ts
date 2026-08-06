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
}
