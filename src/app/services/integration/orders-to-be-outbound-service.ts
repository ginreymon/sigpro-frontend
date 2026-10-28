import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseCrudService } from '../common/base-crud-service';
import { OrderToBeOutbound } from '../../models/integration/order-to-be-outbound';
import { IntegrationSummary } from '../../models/integration/integration-summary';

@Injectable({
  providedIn: 'root',
})
export class OrdersToBeOutboundService extends BaseCrudService<OrderToBeOutbound> {
  protected override _endpoint: string = '/integration/orders-to-be-outbound/';

  // The backend requires a bounded period (max 31 days). Both bounds are ISO UTC datetimes.
  getIntegrationSummary(firstStartFrom: string, lastEndTo: string): Observable<IntegrationSummary> {
    const params = new HttpParams()
      .set('first_start_from', firstStartFrom)
      .set('last_end_to', lastEndTo);
    return this.http.get<IntegrationSummary>(`${this.endpoint}integration-summary/`, { params });
  }
}
