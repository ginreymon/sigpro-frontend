import { Injectable } from '@angular/core';
import { BaseCrudService } from '../common/base-crud-service';
import { ProductionArea } from '../../models/production/production-area';

@Injectable({
  providedIn: 'root',
})
export class ProductionAreaService extends BaseCrudService<ProductionArea> {
  protected override _endpoint: string = '/production/production-areas/';
}
