import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { BaseCrudService } from '../common/base-crud-service';
import { AuditRecord, AuditRecordBulkPayload, AuditedOpSummary } from '../../models/stamping/audit-record';
import { PaginatedResponse } from '../../common/interfaces/paginated-response';

@Injectable({
  providedIn: 'root',
})
export class AuditRecordService extends BaseCrudService<AuditRecord> {
  protected override _endpoint: string = '/stamping/audit-records/';

  replaceBulk(payload: AuditRecordBulkPayload): Observable<AuditRecord[]> {
    return this.http.put<AuditRecord[]>(`${this.endpoint}bulk/`, payload);
  }

  deleteBulk(opNumber: number, opRowid: number, opType: string): Observable<void> {
    return this.http.delete<void>(`${this.endpoint}bulk/`, {
      params: { op_number: opNumber, op_rowid: opRowid, op_type: opType },
    });
  }

  confirmBulk(opNumber: number, opRowid: number, opType: string): Observable<AuditRecord[]> {
    return this.http.post<AuditRecord[]>(
      `${this.endpoint}bulk/confirm/`,
      {},
      { params: { op_number: opNumber, op_rowid: opRowid, op_type: opType } },
    );
  }

  // Global list, one row per audited OP — most recently audited first
  // (backend orders by -updated_at).
  getAuditedOps(limit: number, offset: number): Observable<PaginatedResponse<AuditedOpSummary>> {
    return this.http
      .get<PaginatedResponse<AuditedOpSummary>>(`${this.endpoint}audited-ops/`, {
        params: { limit, offset },
      })
      .pipe(map((resp) => ({ ...resp, params: { limit, offset } })));
  }
}
