import { Injectable } from '@angular/core';
import { BaseCrudService } from '../common/base-crud-service';
import { Observable } from 'rxjs';
import { Employee } from '../../models/production/employee';

@Injectable({
  providedIn: 'root',
})
export class EmployeeDirectoryService extends BaseCrudService<Employee> {
  protected override _endpoint: string = '/user/employee-directory/';

  /** Employees without an account, plus the one already linked to `includeUserId`. */
  available(includeUserId?: number): Observable<Employee[]> {
    const params: Record<string, number> = includeUserId ? { include_user: includeUserId } : {};
    return this.http.get<Employee[]>(`${this.endpoint}available/`, { params });
  }
}
