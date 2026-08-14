import { Injectable } from '@angular/core';
import { BaseCrudService } from '../common/base-crud-service';
import { EmployeeContinuousWorkLimit } from '../../models/production/employee-continuous-work-limit';

@Injectable({
  providedIn: 'root',
})
export class EmployeeContinuousWorkLimitService extends BaseCrudService<EmployeeContinuousWorkLimit> {
  protected override _endpoint: string = '/production/employee-continuous-work-limits/';
}
