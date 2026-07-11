import { AfterViewChecked, Component, ElementRef, signal, ViewChild } from '@angular/core';
import { ButtonBase } from '../../../common/classes/button-base';

@Component({
  selector: 'app-ui-button',
  imports: [],
  templateUrl: './ui-button.html',
  styleUrl: './ui-button.css',
})
export class UiButton extends ButtonBase implements AfterViewChecked {
  @ViewChild('labelSpan') private labelSpan?: ElementRef<HTMLSpanElement>;

  hasLabel = signal(false);

  ngAfterViewChecked(): void {
    this.hasLabel.set(!!this.labelSpan?.nativeElement.textContent?.trim());
  }
}
