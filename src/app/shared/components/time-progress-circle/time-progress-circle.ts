import { Component, EventEmitter, Input, Output, signal, OnDestroy } from '@angular/core';

@Component({
  selector: 'app-time-progress-circle',
  standalone: true,
  templateUrl: './time-progress-circle.html',
  styleUrl: './time-progress-circle.css',
})
export class TimeProgressCircle implements OnDestroy {
  elapsed: number = 0;
  radius = 90;
  fullDash = 2 * Math.PI * this.radius;
  dashOffset = signal(this.fullDash);
  isEnding = signal<boolean>(false);
  isCompleted = signal(false);
  isReady = signal(false);
  displayTime = signal<string>('00:00:00');
  pauseCountdown = signal<string>('');
  pauseEndElapsed: number = 0;

  private startTimestamp = 0;
  private offset = 0;
  private interval: any;
  private resumeEmitted = false;

  private _serverNow: string | Date = new Date();
  private _startTime: string | Date = new Date();
  private _pauseDurationSeconds: number = 0;
  private _pauseStartTime: string | Date | undefined = undefined;
  private _isPaused: boolean = false;
  
  private _rawStartTime: string | Date | null = null;
  private _rawServerNow: string | Date | null = null;

  @Input() duration: number = 3600;
  @Input() endingThresholdMinutes: number | null = null;
  @Input() totalPauseSeconds: number = 0;
  @Input() forceError: boolean = false;
  @Input() showRealTime: boolean = false;

  /**
   * Fuente de verdad del estado pausa — viene del servicio (isPaused computed).
   * Reemplaza checkingPause interno que fallaba con custom breaks.
   */
  @Input()
  set isPaused(value: boolean) {
    this._isPaused = value;
    if (!value) {
      this.resumeEmitted = false;
      this.pauseCountdown.set('');
    }
  }
  get isPaused(): boolean { return this._isPaused; }

  @Input()
  set pauseStartTime(time: string | Date | undefined) {
    this._pauseStartTime = time ?? undefined;
    this.resumeEmitted = false;
  }

  @Input()
  set pauseDurationSeconds(seconds: number | undefined) {
    this._pauseDurationSeconds = Math.floor(Number(seconds) || 0);
  }

  @Input()
  set startTime(date: string | Date | null) {
    if (!date || date === this._rawStartTime) return;

    this._rawStartTime = date;
    this._startTime = date;

    this.initialize();
  }

  @Input()
  set serverNow(date: string | Date | null) {
    if (!date || date === this._rawServerNow) return;

    this._rawServerNow = date;
    this._serverNow = date;

    this.initialize();
  }

  @Output() onCompleted = new EventEmitter<void>();
  @Output() onResume = new EventEmitter<void>();

  ngOnDestroy(): void {
    this.clearTimer();
  }

  private initialize() {
    if (!this._startTime || !this._serverNow) return;
    const clientNow = Date.now();
    const serverNow = new Date(this._serverNow).getTime();
    this.offset = serverNow - clientNow;
    this.startTimestamp = new Date(this._startTime).getTime();
    this.startTimer();
  }

  private startTimer() {
    this.clearTimer();
    this.isReady.set(false);
    this.isCompleted.set(false);

    const tick = () => {
      const now = Date.now() + this.offset;
      const rawElapsed = Math.floor((now - this.startTimestamp) / 1000);
      if (rawElapsed < 0) return;

      if (this._isPaused && this._pauseStartTime) {
        // CONGELAR: calcular elapsed neto en el momento que inició la pausa
        // rawAtPause = segundos brutos desde inicio hasta que arrancó la pausa
        // elapsed = rawAtPause - totalPauseSeconds (pausas previas ya completadas)
        const pauseStartMs = new Date(this._pauseStartTime).getTime();
        const rawAtPause = Math.floor((pauseStartMs - this.startTimestamp) / 1000);
        this.elapsed = Math.max(rawAtPause - this.totalPauseSeconds, 0);

        // Solo breaks predefinidos tienen countdown
        if (this._pauseDurationSeconds > 0) {
          const pauseEndTs = pauseStartMs + this._pauseDurationSeconds * 1000;
          this.pauseEndElapsed = Math.floor((pauseEndTs - now) / 1000);
          if (this.pauseEndElapsed > 0) {
            this.pauseCountdown.set(this.formatText(this.pauseEndElapsed));
          } else if (!this.resumeEmitted) {
            // Break predefinido expiró — emitir una sola vez
            this.resumeEmitted = true;
            this.pauseCountdown.set('');
            this.onResume.emit();
          }
        }
        // Custom break: pauseCountdown = '' → template muestra "Pausado"
      } else {
        // CORRIENDO: restar todas las pausas completadas
        this.elapsed = Math.max(rawElapsed - this.totalPauseSeconds, 0);
      }

      this.updateText();
      this.updateCircle();
    };

    tick();
    setTimeout(() => this.isReady.set(true), 50);
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
    const s = Math.floor(elapsed % 60);
    return `${this.pad(h)}:${this.pad(m)}:${this.pad(s)}`;
  }

  private updateText() {
    if (this._isPaused && this._pauseStartTime) {
      const pauseStart = new Date(this._pauseStartTime);
      this.displayTime.set(`${this.pad(pauseStart.getHours())}:${this.pad(pauseStart.getMinutes())}:${this.pad(pauseStart.getSeconds())}`);
    } else if (this.showRealTime) {
      const now = new Date(Date.now() + this.offset);
      this.displayTime.set(`${this.pad(now.getHours())}:${this.pad(now.getMinutes())}:${this.pad(now.getSeconds())}`);
    } else {
      this.displayTime.set(this.formatText(this.elapsed));
    }
  }

  private updateCircle() {
    const progress = Math.min(this.elapsed / this.duration, 1);
    this.dashOffset.set(this.fullDash * (1 - progress));
    const remaining = this.duration - this.elapsed;
    const threshold = this.endingThresholdMinutes !== null
      ? this.endingThresholdMinutes * 60
      : this.duration * 0.25;
    this.isEnding.set(remaining <= threshold);
    if (remaining <= 0) {
      this.isCompleted.set(true);
      this.onCompleted.emit();
    }
  }

  private pad(n: number): string {
    return n.toString().padStart(2, '0');
  }
}
