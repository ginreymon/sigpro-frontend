import { Injectable } from '@angular/core';
import { BaseCrudService } from '../common/base-crud-service';
import { Observable } from 'rxjs';
import { WorkSessionActivity } from '../../models/production/work-session-activity';
import { PausePayload } from '../../models/production/work-break-record';

@Injectable({
  providedIn: 'root',
})

export class WorkSessionActivityService extends BaseCrudService<WorkSessionActivity> {
  protected override _endpoint: string = '/production/work-session-activities/';

  pause(id: number, data: PausePayload): Observable<any> {
    return this.http.post(`${this.endpoint}${id}/pause/`, data);
  }

  pauseAutoResume(id: number, data: PausePayload): Observable<any> {
    return this.http.post(`${this.endpoint}${id}/pause-autoresume/`, data);
  }

  resume(id: number): Observable<any> {
    return this.http.post(`${this.endpoint}${id}/resume/`, {});
  }
}
