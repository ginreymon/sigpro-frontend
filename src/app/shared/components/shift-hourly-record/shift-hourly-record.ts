import { Component, Input, OnChanges, OnDestroy, signal, SimpleChanges } from '@angular/core';
import { BoxLayout } from '../box-layout/box-layout';
import { TimeProgressCircle } from '../time-progress-circle/time-progress-circle';
import { UiButton } from '../../elements/ui-button/ui-button';
import { UiIcon } from '../../elements/ui-icon/ui-icon';

@Component({
  selector: 'app-shift-hourly-record',
  standalone: true,
  imports: [BoxLayout, TimeProgressCircle, UiButton, UiIcon],
  templateUrl: './shift-hourly-record.html',
})
export class ShiftHourlyRecord implements OnChanges, OnDestroy {
  @Input() enabled = false;

  protected isOpen = signal(false);
  protected isInWindow = signal(false);
  protected missed = signal(false);
  protected hourStart = signal<Date>(this.getHourStart());
  protected serverNow = signal<Date>(new Date());

  private intervalId?: ReturnType<typeof setInterval>;
  private wasInWindow = false;
  private registeredThisWindow = false;

  ngOnChanges(changes: SimpleChanges): void {
    if ('enabled' in changes) {
      this.enabled ? this.startTimer() : this.stopTimer();
    }
  }

  ngOnDestroy(): void {
    this.stopTimer();
  }

  protected register(): void {
    if (!this.isInWindow()) return;
    this.registeredThisWindow = true;
    this.missed.set(false);
    this.isOpen.set(false);
  }

  private getHourStart(): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), 0, 0, 0);
  }

  private startTimer(): void {
    this.stopTimer();
    this.hourStart.set(this.getHourStart());
    this.serverNow.set(new Date());
    this.wasInWindow = false;
    this.registeredThisWindow = false;
    this.isOpen.set(true);
    this.tick();
    this.intervalId = setInterval(() => this.tick(), 1000);
  }

  private stopTimer(): void {
    clearInterval(this.intervalId);
    this.intervalId = undefined;
    this.isOpen.set(false);
    this.isInWindow.set(false);
    this.missed.set(false);
    this.wasInWindow = false;
    this.registeredThisWindow = false;
  }

  private tick(): void {
    const now = new Date();
    const currentHourStart = this.getHourStart();
    const nextHour = new Date(currentHourStart.getTime() + 3600_000);
    const remainingSeconds = Math.floor((nextHour.getTime() - now.getTime()) / 1000);
    const elapsedInHour = Math.floor((now.getTime() - currentHourStart.getTime()) / 1000);
    const inWindow = (remainingSeconds <= 300 && remainingSeconds > 0) || elapsedInHour <= 300;

    if (currentHourStart.getTime() !== this.hourStart().getTime()) {
      this.hourStart.set(currentHourStart);
      this.serverNow.set(new Date(now));
    }

    if (inWindow && !this.wasInWindow) {
      this.wasInWindow = true;
      this.registeredThisWindow = false;
      this.missed.set(false);
      this.isOpen.set(true);
    }

    if (!inWindow && elapsedInHour > 300 && this.wasInWindow) {
      this.wasInWindow = false;
      if (!this.registeredThisWindow) {
        this.missed.set(true);
      }
    }

    this.isInWindow.set(inWindow);

    if (!inWindow && !this.isOpen()) {
      this.isOpen.set(true);
    }
  }
}
