import { Injectable } from '@angular/core';
import { BaseCrudService } from '../common/base-crud-service';
import { WorkSession } from '../../models/production/work-session';
import { Observable, of, switchMap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class WorkSessionService extends BaseCrudService<WorkSession> {
  protected override _endpoint: string = '/production/work-sessions/';

  getActive(params?: Record<string, string | number>): Observable<any> {
    return this.http.get(`${this.endpoint}active/`, { params });
  }

  closeSession(id: number): Observable<any> {
    return this.http.post(`${this.endpoint}${id}/close/`, {});
  }

  /** Closes the authenticated user's open session, if any (the backend scopes `active/` to the requester). */
  closeActive(): Observable<unknown> {
    return this.getActive().pipe(
      switchMap((session) => (session?.id ? this.closeSession(session.id) : of(null))),
    );
  }

  rotateActivity(id: number, employeeIds: number[], apprenticeIds: number[] = []): Observable<any> {
    return this.http.post(`${this.endpoint}${id}/rotate/`, { employee_ids: employeeIds, apprentice_ids: apprenticeIds });
  }

  finalizeEditing(id: number): Observable<any> {
    return this.http.patch(`${this.endpoint}${id}/`, { editing_finalized: true });
  }
}
