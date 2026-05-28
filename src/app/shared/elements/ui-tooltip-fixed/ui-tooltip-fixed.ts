import { Component } from '@angular/core';
import { TooltipBase } from '../ui-tooltip/tooltip-base';

@Component({
  selector: 'app-ui-tooltip-fixed',
  standalone: true,
  imports: [],
  templateUrl: './ui-tooltip-fixed.html',
})
export class UiTooltipFixed extends TooltipBase {
  protected fixedStyle: Record<string, string> = {};
  protected visible = false;

  protected onEnter(event: MouseEvent): void {
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    this.fixedStyle = this.computeFixedStyle(rect);
    this.visible = true;
  }

  protected onLeave(): void {
    this.visible = false;
  }
}
