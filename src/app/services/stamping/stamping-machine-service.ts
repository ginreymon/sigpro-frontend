import { Injectable } from '@angular/core';
import { BaseCrudService } from '../common/base-crud-service';
import { StampingMachine } from '../../models/stamping/stamping-machine';

@Injectable({
  providedIn: 'root',
})
export class StampingMachineService extends BaseCrudService<StampingMachine> {
  protected override _endpoint: string = '/stamping/machines/';
}
