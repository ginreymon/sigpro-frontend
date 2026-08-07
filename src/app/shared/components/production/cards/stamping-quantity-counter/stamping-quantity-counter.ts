import { Component, Input } from '@angular/core';
import { ProgressBar } from '../../../widgets/progress-bar/progress-bar';

@Component({
  selector: 'app-stamping-quantity-counter',
  standalone: true,
  imports: [ProgressBar],
  templateUrl: './stamping-quantity-counter.html',
})
export class StampingQuantityCounter {
  // Recibe el avance del SAM seleccionado, no el total del OP: cada SAM
  // (según el módulo que estampó) es un proceso independiente sobre la
  // misma OP y no comparte avance con otro SAM.
  @Input() orderedQty: number | null = null;
  @Input() stampedQtyBase = 0;
  @Input() newCompletedQty = 0;

  get stampedQty(): number {
    return this.stampedQtyBase + this.newCompletedQty;
  }

  get toDo(): number {
    return Math.max(0, (this.orderedQty ?? 0) - this.stampedQty);
  }
}
