import { Component, EventEmitter, Input, Output, signal, OnDestroy } from '@angular/core';

@Component({
  selector: 'app-time-progress-circle',
  standalone: true,
  templateUrl: './time-progress-circle.html',
  styleUrl: './time-progress-circle.css',
})
export class TimeProgressCircle implements OnDestroy {
  elapsed: number = 0;
  radius = 100;
  fullDash = 2 * Math.PI * this.radius;
  dashOffset = signal(this.fullDash);
  isEnding = signal<boolean>(false);
  displayTime = signal<string>('00:00:00');
  pauseCountdown = signal<string>('00:00:00');
  pauseEndElapsed: number = 0;

  private startTimestamp = 0;
  private offset = 0;
  private interval: any;
  private checkingPause: boolean = false;

  private _serverNow: string | Date = new Date();
  private _startTime: string | Date = new Date();
  private _pauseDurationSeconds: number = 0;
  private _pauseStartTime: string | Date | null = null;

  // seconds 
  @Input() duration: number = 3600;
  @Input() totalPauseSeconds: number = 0;

  @Input()
  set pauseStartTime(time: any) {
    if (time) {
      this._pauseStartTime = time;
      this.checkingPause = true;
    }
  }

  @Input()
  set pauseDurationSeconds(seconds: any) {
    if (seconds) {
      this._pauseDurationSeconds = seconds;
      this.checkingPause = true;
    }
  } 

  @Input()
  set startTime(date: string | Date) {
    this._startTime = date;
    this.initialize();
  }

  @Input()
  set serverNow(date: string | Date) {
    this._serverNow = date;
    this.initialize();
  }

  @Output() completed = new EventEmitter<void>();

  ngOnDestroy(): void {
    this.clearTimer();
  }

  get isPaused() {
    return this.checkingPause;
  }

  private initialize() {
    if (!this._startTime || !this._serverNow) return;

    this.elapsed = 0;
    const clientNow = Date.now();
    const serverNow = new Date(this._serverNow).getTime();

    this.offset = serverNow - clientNow;
    this.startTimestamp = new Date(this._startTime).getTime();

    this.startTimer();
  }

  private startTimer() {
    this.clearTimer();

    const tick = () => {
      const now = Date.now() + this.offset;
      this.elapsed = Math.floor((now - this.startTimestamp) / 1000);
      if (this.elapsed < 0) return;

      if (this.checkingPause && this._pauseStartTime) {
        const pauseStartTimestamp = new Date(this._pauseStartTime).getTime();
        const pauseEndTimestamp = pauseStartTimestamp + (this._pauseDurationSeconds * 1000);
        this.pauseEndElapsed = Math.floor((pauseEndTimestamp - now) / 1000);
        this.checkingPause = this.pauseEndElapsed > 0;

        if (this.checkingPause) {
          this.elapsed = this.elapsed - this.pauseEndElapsed;
          this.pauseCountdown.set(this.formatText(this.pauseEndElapsed));
          return;
        }
      }

      this.updateText();
      this.updateCircle();

    };

    tick();
    this.interval = setInterval(tick, 1000);
  }

  private clearTimer() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  private formatText(elapsed: number) {
    const h = Math.floor(elapsed / 3600);
    const m = Math.floor((elapsed % 3600) / 60);
    const s = elapsed % 60;

    return `${this.pad(h)}:${this.pad(m)}:${this.pad(s)}`;
  }

  private updateText() {
    this.displayTime.set(this.formatText(this.elapsed));
  }

  private updateCircle() {
    const progress = Math.min(this.elapsed / this.duration, 1);
    this.dashOffset.set(this.fullDash * (1 - progress));

    const remaining = this.duration - this.elapsed;

    this.isEnding.set(remaining <= this.duration * 0.25);

    if (remaining <= 0) {
      this.completed.emit();      
    }
  }

  private pad(n: number): string {
    return n.toString().padStart(2, '0');
  }
}
