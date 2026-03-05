import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-ui-tooltip',
  imports: [],
  templateUrl: './ui-tooltip.html',
  styleUrl: './ui-tooltip.css',
})
export class UiTooltip {
  @Input() tooltip: 'top' | 'bottom' | 'left' | 'right' = 'top';
  @Input() message: string = '';

  get tooltipPosition() {
    switch (this.tooltip) {
      case 'bottom':
        return 'top-full left-1/2 -translate-x-1/2 mt-2';
      case 'left':
        return 'right-full top-1/2 -translate-y-1/2 mr-2';
      case 'right':
        return 'left-full top-1/2 -translate-y-1/2 ml-2';
      default:
        return 'bottom-full left-1/2 -translate-x-1/2 mb-2';
    }
  }
}
