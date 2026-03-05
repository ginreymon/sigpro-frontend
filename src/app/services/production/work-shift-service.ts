import { Injectable } from '@angular/core';
import { BaseCrudService } from '../common/base-crud-service';
import { WorkShift } from '../../models/production/work-shift';

@Injectable({
  providedIn: 'root',
})
export class WorkShiftService extends BaseCrudService<WorkShift> {
  protected override _endpoint: string = '/production/work-shifts/';
}
