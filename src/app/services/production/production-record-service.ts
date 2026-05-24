import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseCrudService } from '../common/base-crud-service';
import { ProductionRecord } from '../../models/production/production-record';

@Injectable({
  providedIn: 'root',
})
export class ProductionRecordService extends BaseCrudService<ProductionRecord> {
  protected override _endpoint: string = '/production/production-records/';

  getLast(): Observable<ProductionRecord | null> {
    return this.http.get<ProductionRecord | null>(`${this.endpoint}last/`);
  }
}
