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

  // Homólogo a ProductionRecordService.createManualBatch, para módulos de
  // estampación con allows_production_time_adjustment=true. Mismo payload:
  // duration_seconds cubre el lote completo, no cada registro individual.
  createManualBatch(
    records: Partial<StampingRecord>[],
    duration_seconds: number,
  ): Observable<StampingRecord[]> {
    return this.http.post<StampingRecord[]>(`${this.endpoint}manual-duration-batch/`, {
      records,
      duration_seconds,
    });
  }
}
