import { Component, Input } from '@angular/core';
import { UiIcon } from '../ui-icon/ui-icon';
import { BaseInputIcon } from '../../../common/classes/base-input-icon';

@Component({
  selector: 'app-validation-icon',
  imports: [UiIcon],
  templateUrl: './validation-icon.html',
  styleUrl: './validation-icon.css',
})
export class ValidationIcon extends BaseInputIcon {
  @Input() matchPattern: boolean = false;
}
