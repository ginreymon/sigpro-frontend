import { Component, Input } from '@angular/core';
import { getInputIconClasses } from '../../../common/functions/get-input-icon-classes';
import { UiIcon } from '../ui-icon/ui-icon';


@Component({
  selector: 'app-validation-icon',
  imports: [UiIcon],
  templateUrl: './validation-icon.html',
  styleUrl: './validation-icon.css',
})
export class ValidationIcon {
  
  @Input() invalid: boolean = false;
  @Input() matchPattern: boolean = false;

  get classes() {
    return getInputIconClasses(this.invalid);
  }
}
