import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-progress-bar',
  imports: [],
  templateUrl: './progress-bar.html',
  styleUrl: './progress-bar.css',
})
export class ProgressBar {
  private _rawProgress: number = 0;
  private _max: number = 100;

  progressPercent: number = 0;
  progressColor: string = 'hsl(0, 100%, 50%)';

  @Input() color: string | null = null;

  @Input()
  set max(value: number) {
    this._max = value;
    this._recalculate();
  }

  @Input()
  set progress(value: number) {
    this._rawProgress = value;
    this._recalculate();
  }

  private _recalculate(): void {
    const ratio = this._max > 0 ? this._rawProgress / this._max : 0;
    this.progressPercent = Math.min(ratio * 100, 100);
    const hue = (this.progressPercent / 100) * 120;
    this.progressColor = `hsl(${hue}, 100%, 45%)`;
  }

  get resolvedColor(): string {
    return this.color ?? this.progressColor;
  }

  target() {
    return this.progressPercent >= 100;
  }
}
