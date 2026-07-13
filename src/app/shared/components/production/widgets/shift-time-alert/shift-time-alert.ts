import { Component, Input, OnChanges, OnDestroy, SimpleChanges, signal } from '@angular/core';
import { UiCloseButton } from '../../../../elements/ui-close-button/ui-close-button';
import { UiIcon } from '../../../../elements/ui-icon/ui-icon';

@Component({
  selector: 'app-shift-time-alert',
  standalone: true,
  imports: [UiCloseButton, UiIcon],
  templateUrl: './shift-time-alert.html',
  styleUrl: './shift-time-alert.css',
})
export class ShiftTimeAlert implements OnChanges, OnDestroy {
  @Input() enabled = false;

  protected visible = signal(false);
  protected currentTime = signal('');

  private intervalId?: ReturnType<typeof setInterval>;
  private dismissTimer?: ReturnType<typeof setTimeout>;
  private lastShownKey = '';

  ngOnChanges(changes: SimpleChanges): void {
    if ('enabled' in changes) {
      this.enabled ? this.startTimer() : this.stopTimer();
    }
  }

  ngOnDestroy(): void {
    this.stopTimer();
  }

  protected close(): void {
    clearTimeout(this.dismissTimer);
    this.visible.set(false);
  }

  private startTimer(): void {
    this.stopTimer();
    this.checkAndShow();
    this.intervalId = setInterval(() => this.checkAndShow(), 30_000);
  }

  private stopTimer(): void {
    clearInterval(this.intervalId);
    clearTimeout(this.dismissTimer);
    this.intervalId = undefined;
    this.visible.set(false);
  }

  private checkAndShow(): void {
    const now = new Date();
    const minutes = now.getMinutes();
    if (![0, 45, 50, 55].includes(minutes)) return;

    const key = `${now.getHours()}:${minutes}`;
    if (key === this.lastShownKey) return;

    this.lastShownKey = key;
    const hh = now.getHours().toString().padStart(2, '0');
    const mm = minutes.toString().padStart(2, '0');
    this.currentTime.set(`${hh}:${mm}`);
    this.visible.set(true);

    clearTimeout(this.dismissTimer);
    this.dismissTimer = setTimeout(() => this.visible.set(false), 8_000);
  }
}
