import { Component, Input } from '@angular/core';
import { OrderToBeOutboundDetail } from '../../../../models/integration/order-to-be-outbound';

@Component({
  selector: 'app-op-totals-table',
  imports: [],
  templateUrl: './op-totals-table.html',
  styleUrl: './op-totals-table.css',
})
export class OpTotalsTable {
  @Input() detail: OrderToBeOutboundDetail[] = [];
}
