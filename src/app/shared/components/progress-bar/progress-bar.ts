import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-progress-bar',
  imports: [],
  templateUrl: './progress-bar.html',
  styleUrl: './progress-bar.css',
})
export class ProgressBar {
  private _progress: number = 0;

  progressPercent: number = 0;
  progressColor: string = 'hsl(0, 100%, 50%)';

  @Input() max: number = 100;

  @Input()
  set progress(value: number) {
    this._progress = this.max > 0 ? value / this.max : 0;

    this.progressPercent = Math.min(this._progress * 100, 100);

    // 0 = rojo, 120 = verde
    const hue = (this.progressPercent / 100) * 120;

    this.progressColor = `hsl(${hue}, 100%, 45%)`;
  }

  target() {
    return this.progressPercent >= 100;
  }
}
