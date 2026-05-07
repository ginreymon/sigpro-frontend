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
  dashOffset = this.fullDash;
  isEnding = signal<boolean>(false);
  displayTime = signal<string>('00:00:00');

  private startTimestamp = 0;
  private offset = 0;
  private interval: any;

  // seconds 
  @Input() duration: number = 3600;

  private _serverNow: string | Date = new Date();
  private _startTime: string | Date = new Date();

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

  private updateText() {
    const h = Math.floor(this.elapsed / 3600);
    const m = Math.floor((this.elapsed % 3600) / 60);
    const s = this.elapsed % 60;   

    this.displayTime.set(`${this.pad(h)}:${this.pad(m)}:${this.pad(s)}`);
  }

  private updateCircle() {  
    const progress = Math.min(this.elapsed / this.duration, 1);
    this.dashOffset = this.fullDash * (1 - progress);

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
