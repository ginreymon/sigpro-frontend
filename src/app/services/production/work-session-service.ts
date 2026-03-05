import { Injectable } from '@angular/core';
import { BaseCrudService } from '../common/base-crud-service';
import { WorkSession } from '../../models/production/work-session';

@Injectable({
  providedIn: 'root',
})
export class WorkSessionService extends BaseCrudService<WorkSession> {
  protected override _endpoint: string = '/production/work-sessions/';
}
