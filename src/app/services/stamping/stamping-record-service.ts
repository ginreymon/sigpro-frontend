import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseCrudService } from '../common/base-crud-service';
import { StampingRecord } from '../../models/stamping/stamping-record';

@Injectable({
  providedIn: 'root',
})
export class StampingRecordService extends BaseCrudService<StampingRecord> {
  protected override _endpoint: string = '/stamping/stamping-records/';

  getRecent(): Observable<StampingRecord[]> {
    return this.http.get<StampingRecord[]>(`${this.endpoint}recent/`);
  }
}
