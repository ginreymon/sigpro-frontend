import { Component } from '@angular/core';
import { ProgressBar } from '../../../widgets/progress-bar/progress-bar';
import { StampingQuantityCounter } from '../stamping-quantity-counter/stamping-quantity-counter';

// Compact variant of StampingQuantityCounter for inline placement right below
// the shift summary: inherits inputs and stampedQty/toDo, only the layout differs.
@Component({
  selector: 'app-stamping-progress-summary',
  standalone: true,
  imports: [ProgressBar],
  templateUrl: './stamping-progress-summary.html',
})
export class StampingProgressSummary extends StampingQuantityCounter {}
