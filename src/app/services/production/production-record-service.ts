import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpParams } from '@angular/common/http';
import { BaseCrudService } from '../common/base-crud-service';
import { ProductionRecord } from '../../models/production/production-record';
import { ManualBatchSimulation } from '../../models/production/manual-batch-simulation';

@Injectable({
  providedIn: 'root',
})
export class ProductionRecordService extends BaseCrudService<ProductionRecord> {
  protected override _endpoint: string = '/production/production-records/';

  getRecent(limit?: number): Observable<ProductionRecord[]> {
    const params = limit ? new HttpParams().set('limit', limit) : undefined;
    return this.http.get<ProductionRecord[]>(`${this.endpoint}recent/`, { params });
  }

  // Variante de create() para módulos con allows_production_time_adjustment=true:
  // el backend calcula start_time/end_time a partir de duration_seconds.
  // Sirve tanto para un solo registro (records con 1 elemento) como para un
  // lote — duration_seconds cubre el lote completo, no cada registro
  // individual. La respuesta es la lista de todos los registros guardados
  // (mismo shape que create()), cada uno con el duration_seconds del lote.
  createManualBatch(
    records: Partial<ProductionRecord>[],
    duration_seconds: number,
  ): Observable<ProductionRecord[]> {
    return this.http.post<ProductionRecord[]>(`${this.endpoint}manual-duration-batch/`, {
      records,
      duration_seconds,
    });
  }

  // Dry run of createManualBatch: returns the allowed duration range and the
  // estimated efficiency for duration_seconds (null = range only).
  simulateManualBatch(
    records: Partial<ProductionRecord>[],
    duration_seconds: number | null,
  ): Observable<ManualBatchSimulation> {
    return this.http.post<ManualBatchSimulation>(`${this.endpoint}manual-duration-batch/simulate/`, {
      records,
      duration_seconds,
    });
  }
}
