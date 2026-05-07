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

  @Input()
  set progress(value: number) {
    this._progress = this.max > 0 ? value / this.max : 0;
    this.progressPercent = Math.min(this._progress * 100, 100);
  }
  @Input() max: number = 100;

  isEnding() {
    return this.progressPercent >= 75;
  }
}
