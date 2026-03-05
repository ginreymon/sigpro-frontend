import { Injectable } from '@angular/core';
import { BaseCrudService } from '../common/base-crud-service';
import { WorkBreakRecord } from '../../models/production/work-break-record';

@Injectable({
  providedIn: 'root',
})
export class WorkBreakRecordService extends BaseCrudService<WorkBreakRecord>{
  protected override _endpoint: string = '/production/work-break-records/';
  
}
