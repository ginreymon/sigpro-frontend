import { Injectable } from '@angular/core';
import { BaseCrudService } from '../common/base-crud-service';
import { StampingRecord } from '../../models/stamping/stamping-record';

@Injectable({
  providedIn: 'root',
})
export class StampingRecordService extends BaseCrudService<StampingRecord> {
  protected override _endpoint: string = '/stamping/stamping-records/';
}
