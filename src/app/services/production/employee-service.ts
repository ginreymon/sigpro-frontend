import { Injectable } from '@angular/core';
import { BaseCrudService } from '../common/base-crud-service';
import { Employee } from '../../models/production/employee';

@Injectable({
  providedIn: 'root',
})
export class EmployeeService extends BaseCrudService<Employee> {
  protected override _endpoint: string = '/production/employees/';
}
