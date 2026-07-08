import { Injectable } from '@angular/core';
import { BaseCrudService } from '../common/base-crud-service';
import { StampingLocation } from '../../models/stamping/stamping-location';

@Injectable({
  providedIn: 'root',
})
export class StampingLocationService extends BaseCrudService<StampingLocation> {
  protected override _endpoint: string = '/stamping/locations/';
}
