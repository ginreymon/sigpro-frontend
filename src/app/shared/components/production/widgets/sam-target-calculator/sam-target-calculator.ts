import { Component, Input, inject } from '@angular/core';
import { SamCalculatorStateService } from './sam-calculator-state';

@Component({
  selector: 'app-sam-target-calculator',
  templateUrl: './sam-target-calculator.html',
  host: { style: 'display: contents' },
})
export class SamTargetCalculator {
  @Input({ required: true }) samValue!: string | null;
  @Input({ required: true }) calcId!: number;

  private stateService = inject(SamCalculatorStateService);

  toggle(event: MouseEvent): void {
    event.stopPropagation();
    this.stateService.open({
      id: this.calcId,
      samValue: this.samValue!,
      clickX: event.clientX,
      clickY: event.clientY,
    });
  }
}
