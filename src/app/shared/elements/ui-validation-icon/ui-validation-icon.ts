import { Component, Input } from '@angular/core';
import { UiIcon } from '../ui-icon/ui-icon';
import { BaseInputIcon } from '../../../common/classes/base-input-icon';

@Component({
  selector: 'app-ui-validation-icon',
  imports: [UiIcon],
  templateUrl: './ui-validation-icon.html',
  styleUrl: './ui-validation-icon.css',
})
export class UiValidationIcon extends BaseInputIcon {
  @Input() matchPattern: boolean = false;
  /** Icon shown when invalid; defaults to the shared 'fail' icon. */
  @Input() failIcon: string = 'fail';
}
