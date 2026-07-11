import { AfterContentChecked, Component, ElementRef, ViewChild } from '@angular/core';
import { ButtonBase } from '../../../common/classes/button-base';

@Component({
  selector: 'app-ui-button',
  imports: [],
  templateUrl: './ui-button.html',
  styleUrl: './ui-button.css',
})
export class UiButton extends ButtonBase implements AfterContentChecked {
  @ViewChild('labelSpan') private labelSpan?: ElementRef<HTMLSpanElement>;

  hasLabel = false;

  ngAfterContentChecked(): void {
    this.hasLabel = !!this.labelSpan?.nativeElement.textContent?.trim();
  }
}
