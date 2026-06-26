import { Injectable } from '@angular/core';
import { BaseCrudService } from '../common/base-crud-service';
import { SheetMeasurement } from '../../models/catalog/sheet-measurement';

@Injectable({ providedIn: 'root' })
export class SheetMeasurementService extends BaseCrudService<SheetMeasurement> {
  protected override _endpoint = '/catalog/sheet-measurements/';
}
