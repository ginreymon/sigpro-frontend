import { Component, Input } from '@angular/core';
import { SkuTaskDetail } from '../../../../../models/production/sku-task-detail';
import { UpperCasePipe } from '@angular/common';

@Component({
  selector: 'app-quantity-detail',
  imports: [UpperCasePipe],
  templateUrl: './quantity-detail.html',
})
export class QuantityDetail {
  @Input() selectedSKU: SkuTaskDetail | null = null;

  get cards() {
    if (!this.selectedSKU) return [];
    return [
      { title: 'Completadas', data: this.selectedSKU.completedQty ?? '' },
      { title: 'Saldos', data: this.selectedSKU.rejectedQty ?? '', error: true },
      { title: 'Bajas', data: this.selectedSKU.wasteQty ?? '', error: true },
    ];
  }
}
