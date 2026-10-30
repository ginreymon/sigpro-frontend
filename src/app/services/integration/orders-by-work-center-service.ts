import { Injectable } from '@angular/core';
import { BaseCrudService } from '../common/base-crud-service';
import { OrderByWorkCenter } from '../../models/integration/order-by-work-center';

@Injectable({
  providedIn: 'root',
})
export class OrdersByWorkCenterService extends BaseCrudService<OrderByWorkCenter> {
  protected override _endpoint: string = '/integration/orders-to-be-outbound/by-work-center/';
}
