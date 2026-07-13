import { Component, Input } from '@angular/core';
import { SkuQuantitySummary } from '../sku-quantity-summary/sku-quantity-summary';

@Component({
  selector: 'app-sku-quantity-counter',
  imports: [],
  templateUrl: './sku-quantity-counter.html',
  styleUrl: './sku-quantity-counter.css',
})
export class SkuQuantityCounter extends SkuQuantitySummary {
  @Input() displayCompletedQty = 0;
  @Input() displayRejectedQty = 0;
  @Input() displayScrapQty = 0;
  @Input() newCompletedQty = 0;
  @Input() newRejectedQty = 0;
  @Input() newScrapQty = 0;

  get completedQty() {
    return this.displayCompletedQty + this.newCompletedQty;
  }
  get rejectedQty() {
    return this.displayRejectedQty + this.newRejectedQty;
  }
  get scrapQty() {
    return this.displayScrapQty + this.newScrapQty;
  }
  override get totalDone(): number {
    return this.completedQty + this.rejectedQty + this.scrapQty;
  }
}
