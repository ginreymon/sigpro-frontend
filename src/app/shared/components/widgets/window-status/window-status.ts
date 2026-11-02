import { Component, computed, input } from '@angular/core';
import { hourlyWindowRange } from '../../../../common/functions/hourly-window';

// Registration-window notice shared by app-shift-hourly-record and app-stamping-record.
// Each process passes its own window (S_H_WINDOW / STAMPING_CAL_WINDOW) in seconds.
@Component({
  selector: 'app-window-status',
  standalone: true,
  templateUrl: './window-status.html',
})
export class WindowStatus {
  inWindow = input.required<boolean>();
  windowSeconds = input.required<number>();

  protected range = computed(() => hourlyWindowRange(this.windowSeconds()));
}
