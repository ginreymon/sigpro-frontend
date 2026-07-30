import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { BaseCrudService } from '../common/base-crud-service';
import { AuditRecord, AuditRecordBulkPayload, AuditedOpSummary, AuditStatus } from '../../models/stamping/audit-record';
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

  // Lightweight status for one OP — no per-color detail, just enough to
  // know if it's already audited when searching an OP.
  getStatus(docType: string, docNumber: number): Observable<AuditStatus> {
    return this.http.get<AuditStatus>(`${this.endpoint}status/`, {
      params: { docType, docNumber },
    });
  }

  // Global list, one row per audited OP — most recently audited first
  // (backend orders by -updated_at). search filters by op_number (parcial).
  getAuditedOps(limit: number, offset: number, search?: string): Observable<PaginatedResponse<AuditedOpSummary>> {
    const params: Record<string, string | number> = { limit, offset };
    if (search) params['search'] = search;

    return this.http
      .get<PaginatedResponse<AuditedOpSummary>>(`${this.endpoint}audited-ops/`, { params })
      .pipe(map((resp) => ({ ...resp, params: { limit, offset } })));
  }
}
