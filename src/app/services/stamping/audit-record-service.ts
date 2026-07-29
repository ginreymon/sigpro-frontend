import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseCrudService } from '../common/base-crud-service';
import { AuditRecord, AuditRecordBulkPayload } from '../../models/stamping/audit-record';

@Injectable({
  providedIn: 'root',
})
export class AuditRecordService extends BaseCrudService<AuditRecord> {
  protected override _endpoint: string = '/stamping/audit-records/';

  createBulk(payload: AuditRecordBulkPayload): Observable<AuditRecord[]> {
    return this.http.post<AuditRecord[]>(this.endpoint, payload);
  }
}
