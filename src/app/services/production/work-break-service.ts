import { Injectable } from '@angular/core';
import { BaseCrudService } from '../common/base-crud-service';
import { WorkBreak } from '../../models/production/work-break';

@Injectable({
  providedIn: 'root',
})
export class WorkBreakService extends BaseCrudService<WorkBreak> {
  protected override _endpoint: string = '/production/work-breaks/';
  
}
