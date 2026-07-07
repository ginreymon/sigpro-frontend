import { Injectable } from '@angular/core';
import { BaseCrudService } from '../common/base-crud-service';
import { StampingProcess } from '../../models/stamping/stamping-process';

@Injectable({
  providedIn: 'root',
})
export class StampingProcessService extends BaseCrudService<StampingProcess> {
  protected override _endpoint: string = '/stamping/processes/';
}
