import { Injectable } from '@angular/core';
import { BaseCrudService } from '../common/base-crud-service';
import { ProductionRecord } from '../../models/production/production-record';

@Injectable({
  providedIn: 'root',
})
export class ProductionRecordService extends BaseCrudService<ProductionRecord> {
  protected override _endpoint: string = '/production/production-records/';
}
