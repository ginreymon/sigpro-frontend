import { Injectable } from '@angular/core';
import { BaseCrudService } from '../common/base-crud-service';
import { StampingFabricType } from '../../models/stamping/stamping-fabric-type';

@Injectable({
  providedIn: 'root',
})
export class StampingFabricTypeService extends BaseCrudService<StampingFabricType> {
  protected override _endpoint: string = '/stamping/fabric-types/';
}
