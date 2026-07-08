import { Injectable } from '@angular/core';
import { BaseCrudService } from '../common/base-crud-service';
import { StampingMachineType } from '../../models/stamping/stamping-machine-type';

@Injectable({
  providedIn: 'root',
})
export class StampingMachineTypeService extends BaseCrudService<StampingMachineType> {
  protected override _endpoint: string = '/stamping/machine-types/';
}
