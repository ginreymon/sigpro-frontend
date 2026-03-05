import { Component, Input, Output, EventEmitter } from '@angular/core';
import { UiIcon } from '../ui-icon/ui-icon';
import { BaseInputIcon } from '../../../common/classes/base-input-icon';

@Component({
  selector: 'app-toggle-password-btn',
  imports: [UiIcon],
  templateUrl: './toggle-password-btn.html',
  styleUrl: './toggle-password-btn.css',
})
export class TogglePasswordBtn extends BaseInputIcon {
  @Input() showPassword: boolean = false;
  @Output() showPasswordChange = new EventEmitter<boolean>();

  togglePassword() {
    this.showPassword = !this.showPassword;
    this.showPasswordChange.emit(this.showPassword);
  }
}
