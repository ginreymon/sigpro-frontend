import { Injectable } from '@angular/core';
import { BaseCrudService } from '../common/base-crud-service';
import { OrderToBeOutbound } from '../../models/integration/order-to-be-outbound';

@Injectable({
  providedIn: 'root',
})
export class OrdersToBeOutboundService extends BaseCrudService<OrderToBeOutbound> {
  protected override _endpoint: string = '/integration/orders-to-be-outbound/';
}
