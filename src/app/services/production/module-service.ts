import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseCrudService } from '../common/base-crud-service';
import { Module } from '../../models/production/module';

@Injectable({
  providedIn: 'root',
})
export class ModuleService  extends BaseCrudService<Module>{
  protected override _endpoint: string = '/production/modules/';

  removeEmployee(moduleId: number, employeeId: number): Observable<{ session_closed: boolean }> {
    return this.http.delete<{ session_closed: boolean }>(`${this.endpoint}${moduleId}/employees/${employeeId}/`);
  }
}
