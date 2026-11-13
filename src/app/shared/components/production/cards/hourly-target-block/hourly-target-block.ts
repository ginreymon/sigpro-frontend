import { Component, Input } from '@angular/core';

// Hourly target = (unit_target / installed hours) * active operators, always rounded up to a whole number; 0 without installed minutes.
@Component({
  selector: 'app-hourly-target-block',
  standalone: true,
  templateUrl: './hourly-target-block.html',
})
export class HourlyTargetBlock {
  @Input() units = 0;
  // Target units for the period and installed minutes (net worked time x employees).
  @Input() unitTarget = 0;
  @Input() installedMinutes = 0;
  // Active employees; operators is the fallback when it is 0 or missing.
  @Input() employees = 0;
  @Input() operators = 0;
  // Greys the block out when the module is not active (live cards).
  @Input() muted = false;

  get hasMinutes(): boolean {
    return this.installedMinutes > 0;
  }

  get activeEmployees(): number {
    return this.employees > 0 ? this.employees : this.operators;
  }

  get hourlyTarget(): number {
    if (!this.hasMinutes) return 0;
    return Math.ceil((this.unitTarget / (this.installedMinutes / 60)) * this.activeEmployees - 1e-9);
  }
}
