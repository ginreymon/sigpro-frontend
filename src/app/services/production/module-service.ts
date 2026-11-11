import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseCrudService } from '../common/base-crud-service';
import { Module } from '../../models/production/module';

@Injectable({
  providedIn: 'root',
})
export class ModuleService  extends BaseCrudService<Module>{
  protected override _endpoint: string = '/production/modules/';

  removeEmployee(moduleId: number, employeeId: number): Observable<void> {
    return this.http.delete<void>(`${this.endpoint}${moduleId}/employees/${employeeId}/`);
  }
}
