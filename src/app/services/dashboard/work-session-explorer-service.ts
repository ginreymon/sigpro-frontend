import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { BaseCrudService } from '../common/base-crud-service';
import { PaginatedResponse } from '../../common/interfaces/paginated-response';
import { QueryParams } from '../../common/interfaces/query-params';
import { WorkSessionExplorerRow } from '../../models/dashboard/work-session-explorer';

const NAIVE_DATETIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?$/;

// SQL Server's FOR JSON drops the offset from datetimes (they are stored in UTC): without a
// trailing Z the browser would read them as local time. Time-only strings (shift snapshots) are untouched.
function withUtc<T>(value: T): T {
  if (typeof value === 'string') return (NAIVE_DATETIME.test(value) ? `${value}Z` : value) as T;
  if (Array.isArray(value)) return value.map(withUtc) as T;
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, withUtc(v)])) as T;
  }
  return value;
}

// Read-only listing of work sessions with their nested records (GET /dashboard/work-sessions/).
// Edits go through the regular CRUD services of each entity.
@Injectable({
  providedIn: 'root',
})
export class WorkSessionExplorerService extends BaseCrudService<WorkSessionExplorerRow> {
  protected override _endpoint: string = '/dashboard/work-sessions/';

  override getAll(params?: QueryParams): Observable<PaginatedResponse<WorkSessionExplorerRow>> {
    return super.getAll(params).pipe(map((res) => ({ ...res, results: withUtc(res.results) })));
  }
}
