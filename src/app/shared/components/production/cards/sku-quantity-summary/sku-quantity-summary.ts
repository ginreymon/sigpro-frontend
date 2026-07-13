import { Component, Input } from '@angular/core';
import { SkuTaskDetail } from '../../../../../models/production/sku-task-detail';
import { ProgressBar } from '../../../widgets/progress-bar/progress-bar';

@Component({
  selector: 'app-sku-quantity-summary',
  standalone: true,
  imports: [ProgressBar],
  templateUrl: './sku-quantity-summary.html',
})
export class SkuQuantitySummary {
  @Input() selectedSKU: SkuTaskDetail | null = null;

  get totalDone(): number {
    if (!this.selectedSKU) return 0;
    return this.selectedSKU.completedQty + this.selectedSKU.rejectedQty + this.selectedSKU.wasteQty;
  }

  get toDo(): number {
    if (!this.selectedSKU) return 0;
    return Math.max(0, this.selectedSKU.orderedQty - this.totalDone);
  }
}
