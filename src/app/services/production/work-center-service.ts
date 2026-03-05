import { Injectable } from '@angular/core';
import { BaseCrudService } from '../common/base-crud-service';
import { WorkCenter } from '../../models/production/work-center';

@Injectable({
  providedIn: 'root',
})
export class WorkCenterService extends BaseCrudService<WorkCenter> {
  protected override _endpoint: string = '/production/work-centers/';
}
