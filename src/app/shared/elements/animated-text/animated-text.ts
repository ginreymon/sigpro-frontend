import { Component, Input, computed, signal } from '@angular/core';

@Component({
  selector: 'app-animated-text',
  templateUrl: './animated-text.html',
})
export class AnimatedText {
  @Input() set text(value: string) { this._text.set(value); }
  @Input() duration = 4.5;
  @Input() letterDelay = 0.2;

  private _text = signal('');

  readonly letters = computed(() =>
    this._text().split('').map((char, i) => ({
      char,
      animation: `letter-appear ${this.duration}s ease-in-out infinite ${i * this.letterDelay}s backwards`,
    }))
  );
}
