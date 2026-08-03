import { Injectable } from '@angular/core';
import { BaseCrudService } from '../common/base-crud-service';
import { ModuleWorkBreakRecord } from '../../models/production/module-work-break-record';

@Injectable({
  providedIn: 'root',
})
export class ModuleWorkBreakRecordService extends BaseCrudService<ModuleWorkBreakRecord> {
  protected override _endpoint: string = '/production/module-work-break-records/';
}
