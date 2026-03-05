import { Injectable } from '@angular/core';
import { BaseCrudService } from '../common/base-crud-service';

@Injectable({
  providedIn: 'root',
})
export class ProductionRecordService extends BaseCrudService<ProductionRecordService> {
  protected override _endpoint: string = '/production/production-records/';
  
}
