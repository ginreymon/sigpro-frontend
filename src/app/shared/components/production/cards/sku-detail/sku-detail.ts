import { Component, Input } from '@angular/core';
import { UpperCasePipe } from '@angular/common';
import { SkuTaskDetail } from '../../../../../models/production/sku-task-detail';

@Component({
  selector: 'app-sku-detail',
  imports: [UpperCasePipe],
  templateUrl: './sku-detail.html',
  styleUrl: './sku-detail.css',
})
export class SkuDetail {
  @Input() selectedSKU: SkuTaskDetail | null = null;

  get cards() {
    if (!this.selectedSKU) return [];
    return [
      { title: 'Color SKU', data: this.selectedSKU.color ?? '' },
      { title: 'Talla', data: this.selectedSKU.size ?? '' },
      { title: 'Referencia', data: this.selectedSKU.reference ?? '' },
      { title: 'OP', data: `${this.selectedSKU.opType ?? ''} ${this.selectedSKU.opNumber ?? ''}`, },
    ];
  }
}
