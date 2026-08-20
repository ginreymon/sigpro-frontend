import { Component, EventEmitter, Input, Output } from '@angular/core';
import { EfficiencySummaryBar } from '../../widgets/efficiency-summary-bar/efficiency-summary-bar';

@Component({
  selector: 'app-home-productivity-card',
  imports: [EfficiencySummaryBar],
  templateUrl: './home-productivity-card.html',
})
export class HomeProductivityCard {
  @Input({ required: true }) label!: string;
  @Input() efficiency = 0;
  @Input() status = 'INACTIVE';
  @Input() completed = 0;
  @Input() activeModules?: number;
  @Input() clickable = false;
  @Output() cardClick = new EventEmitter<void>();

  onClick(): void {
    if (this.clickable) this.cardClick.emit();
  }
}
