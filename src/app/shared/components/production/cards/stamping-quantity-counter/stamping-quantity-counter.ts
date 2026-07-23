import { Component, Input } from '@angular/core';
import { ProgressBar } from '../../../widgets/progress-bar/progress-bar';
import { StampingOrderDetail } from '../../../../../models/stamping/stamping-order-detail';

@Component({
  selector: 'app-stamping-quantity-counter',
  standalone: true,
  imports: [ProgressBar],
  templateUrl: './stamping-quantity-counter.html',
})
export class StampingQuantityCounter {
  @Input() orderDetail: StampingOrderDetail | null = null;
  @Input() newCompletedQty = 0;

  get orderedQty(): number {
    return Number(this.orderDetail?.orderedQty) || 0;
  }

  get stampedQty(): number {
    return (Number(this.orderDetail?.stampedQty) || 0) + this.newCompletedQty;
  }

  get toDo(): number {
    return Math.max(0, this.orderedQty - this.stampedQty);
  }
}
