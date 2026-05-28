import { Component } from '@angular/core';
import { TooltipBase } from './tooltip-base';

@Component({
  selector: 'app-ui-tooltip',
  standalone: true,
  imports: [],
  templateUrl: './ui-tooltip.html',
  styleUrl: './ui-tooltip.css',
})
export class UiTooltip extends TooltipBase {}
