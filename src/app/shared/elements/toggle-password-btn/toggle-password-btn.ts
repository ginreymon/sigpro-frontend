import { Component, Input, Output, EventEmitter } from '@angular/core';
import { getInputIconClasses } from '../../../common/functions/get-input-icon-classes';

@Component({
  selector: 'app-toggle-password-btn',
  imports: [],
  templateUrl: './toggle-password-btn.html',
  styleUrl: './toggle-password-btn.css',
})
export class TogglePasswordBtn {
  @Input() showPassword: boolean = false;
  @Input() invalid: boolean = false;

  @Output() showPasswordChange = new EventEmitter<boolean>();

  togglePassword() {
    this.showPassword = !this.showPassword;
    this.showPasswordChange.emit(this.showPassword);
  }

  get classes() {
    return getInputIconClasses(this.invalid);
  }
}
