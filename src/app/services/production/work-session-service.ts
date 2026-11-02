import { Injectable } from '@angular/core';
import { BaseCrudService } from '../common/base-crud-service';
import { WorkSession } from '../../models/production/work-session';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class WorkSessionService extends BaseCrudService<WorkSession> {
  protected override _endpoint: string = '/production/work-sessions/';

  getActive(params?: Record<string, string | number>): Observable<any> {
    return this.http.get(`${this.endpoint}active/`, { params });
  }

  /** The user's latest session in any state; `closeExpired` makes the backend close it if it expired. */
  getLast(closeExpired = false): Observable<WorkSession | null> {
    const params = closeExpired ? { 'close-expired': 'true' } : undefined;
    return this.http.get<WorkSession | null>(`${this.endpoint}last/`, { params });
  }

  /** Creates a new session from a previous one (the backend closes the original if still open). */
  clone(id: number): Observable<WorkSession> {
    return this.http.post<WorkSession>(`${this.endpoint}${id}/clone/`, {});
  }

  closeSession(id: number): Observable<any> {
    return this.http.post(`${this.endpoint}${id}/close/`, {});
  }

  /** Closes the authenticated user's open session, if any (the backend scopes `active/` to the requester). */
  closeActive(): Observable<unknown> {
    return this.http.post(`${this.endpoint}close-active/`, {});
  }

  rotateActivity(id: number, employeeIds: number[], apprenticeIds: number[] = []): Observable<any> {
    return this.http.post(`${this.endpoint}${id}/rotate/`, { employee_ids: employeeIds, apprentice_ids: apprenticeIds });
  }

  finalizeEditing(id: number): Observable<any> {
    return this.http.patch(`${this.endpoint}${id}/`, { editing_finalized: true });
  }
}
