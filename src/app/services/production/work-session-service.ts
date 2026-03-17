import { Injectable } from '@angular/core';
import { BaseCrudService } from '../common/base-crud-service';
import { WorkSession } from '../../models/production/work-session';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class WorkSessionService extends BaseCrudService<WorkSession> {
  protected override _endpoint: string = '/production/work-sessions/';

  getActive(): Observable<any> {
    return this.http.get(`${this.endpoint}active/`);
  }

  closeSession(id: number): Observable<any> {
    return this.http.post(`${this.endpoint}${id}/close/`, {});
  }
}
