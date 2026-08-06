import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpParams } from '@angular/common/http';
import { BaseCrudService } from '../common/base-crud-service';
import { StampingRecord } from '../../models/stamping/stamping-record';

@Injectable({
  providedIn: 'root',
})
export class StampingRecordService extends BaseCrudService<StampingRecord> {
  protected override _endpoint: string = '/stamping/stamping-records/';

  getRecent(limit?: number): Observable<StampingRecord[]> {
    const params = limit ? new HttpParams().set('limit', limit) : undefined;
    return this.http.get<StampingRecord[]>(`${this.endpoint}recent/`, { params });
  }
}
