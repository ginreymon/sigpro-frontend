import { Component, Input } from '@angular/core';
import { TaskTimerState } from '../../../common/interfaces/task-timer-state';
import { UpperCasePipe } from '@angular/common';

@Component({
  selector: 'app-sku-detail',
  imports: [UpperCasePipe],
  templateUrl: './sku-detail.html',
  styleUrl: './sku-detail.css',
})
export class SkuDetail {
  @Input() state: TaskTimerState | null = null;

  get cards() {
    if (!this.state) return [];

    return [
      { title: 'Color SKU', data: this.state.rowColorItems?.color ?? '' },
      { title: 'Talla', data: this.state.selectedSKU?.size ?? '' },
      { title: 'Referencia', data: this.state.currentOP?.reference ?? '' },
      { title: 'OP', data: `${this.state.currentOP?.documentType ?? ''} ${this.state.currentOP?.documentNumber ?? ''}`, },
    ];
  }
}
