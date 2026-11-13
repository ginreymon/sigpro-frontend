import { Component, Input } from '@angular/core';

// Hourly target = (units / standard hours produced) * active operators; 0 without minutes.
@Component({
  selector: 'app-hourly-target-block',
  standalone: true,
  templateUrl: './hourly-target-block.html',
})
export class HourlyTargetBlock {
  @Input() units = 0;
  @Input() producedMinutes = 0;
  // Active employees; operators is the fallback when it is 0 or missing.
  @Input() employees = 0;
  @Input() operators = 0;
  // Greys the block out when the module is not active (live cards).
  @Input() muted = false;

  get hasMinutes(): boolean {
    return this.producedMinutes > 0;
  }

  get activeEmployees(): number {
    return this.employees > 0 ? this.employees : this.operators;
  }

  get hourlyTarget(): number {
    if (!this.hasMinutes) return 0;
    return Math.round((this.units / (this.producedMinutes / 60)) * this.activeEmployees * 100) / 100;
  }
}
