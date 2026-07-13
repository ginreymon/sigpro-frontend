import { Component, Input, Output, EventEmitter } from '@angular/core';
import { UiIcon } from '../ui-icon/ui-icon';
import { BaseInputIcon } from '../../../common/classes/base-input-icon';

@Component({
  selector: 'app-ui-toggle-password-btn',
  imports: [UiIcon],
  templateUrl: './ui-toggle-password-btn.html',
  styleUrl: './ui-toggle-password-btn.css',
})
export class UiTogglePasswordBtn extends BaseInputIcon {
  @Input() showPassword: boolean = false;
  @Output() showPasswordChange = new EventEmitter<boolean>();

  togglePassword() {
    this.showPassword = !this.showPassword;
    this.showPasswordChange.emit(this.showPassword);
  }
}
