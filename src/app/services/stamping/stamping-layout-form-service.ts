import { Injectable } from '@angular/core';
import { BaseCrudService } from '../common/base-crud-service';
import { StampingLayoutForm } from '../../models/stamping/stamping-layout-form';

@Injectable({
  providedIn: 'root',
})
export class StampingLayoutFormService extends BaseCrudService<StampingLayoutForm> {
  protected override _endpoint: string = '/stamping/layout-forms/';
}
