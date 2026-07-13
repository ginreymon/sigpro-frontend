import { Component } from '@angular/core';
import { AuthLayout } from '../../../layouts/auth-layout/auth-layout';
import { Router, RouterLink } from '@angular/router';
import { BaseAuthComponent } from '../../../common/classes/base-auth-component';
import { AuthService } from '../../../services/auth/auth-service';
import { ResetPasswordService } from '../../../services/auth/reset-password-service';
import { FormGroup, Validators, FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { UiFormActionBtn } from '../../../shared/elements/ui-form-action-btn/ui-form-action-btn';
import { UiTogglePasswordBtn } from '../../../shared/elements/ui-toggle-password-btn/ui-toggle-password-btn';
import { ConfirmPwRequest } from '../../../models/auth/confirm-pw-request';
import { finalize } from 'rxjs';
import { LoaderService } from '../../../services/common/loader-service';
import { UiValidationIcon } from "../../../shared/elements/ui-validation-icon/ui-validation-icon";
import { UiIcon } from '../../../shared/elements/ui-icon/ui-icon';
import { UiErrorMessage } from '../../../shared/elements/ui-error-message/ui-error-message';
import { UiFormField } from '../../../shared/elements/ui-form-field/ui-form-field';
import { UiInput } from '../../../shared/elements/ui-input/ui-input';

@Component({
  selector: 'app-confirm-password',
  imports: [
    AuthLayout,
    RouterLink,
    ReactiveFormsModule,
    UiFormActionBtn,
    UiTogglePasswordBtn,
    UiValidationIcon,
    UiIcon,
    UiErrorMessage,
    UiFormField,
    UiInput,
  ],
  templateUrl: './confirm-password.html',
  styleUrl: './confirm-password.css',
})
export class ConfirmPassword extends BaseAuthComponent {
  confirmForm: FormGroup;
  passwordChanged: boolean = false;

  constructor(
    private fb: FormBuilder,
    private resetPasswordService: ResetPasswordService,
    private auth: AuthService,
    private router: Router,
    private loaderService: LoaderService,
  ) {
    super();
    this.confirmForm = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]],
    });
  }

  get password() {
    return this.confirmForm.get('password');
  }

  get confirmPassword() {
    return this.confirmForm.get('confirmPassword');
  }

  get passwordsMatch() {
    return this.password?.value && this.password?.value === this.confirmPassword?.value;
  }

  reset() {
    if (this.confirmForm.invalid) {
      this.confirmForm.markAllAsTouched();
      return;
    }

    if (!this.passwordsMatch) return;

    const token = this.resetPasswordService.getToken();

    if (!token) {
      this.errorMessage.set('El tiempo válido para restablecer la contrseña ya expiró');
      return;
    }

    this.isLoading.set(true);
    this.loaderService.showLoader();

    const confirmData: ConfirmPwRequest = {
      token,
      new_password: this.password?.value,
    };

    this.auth
      .confirmPassword(confirmData)
      .pipe(finalize(() => { this.isLoading.set(false); this.loaderService.hideLoader(); }))
      .subscribe({
        next: (res) => {
          this.passwordChanged = true;
        },
        error: (err) => {
          this.errorMessage.set('No fue posible restablecer la contraseña');
        },
      });
  }

  toLogin() {
    this.router.navigateByUrl('/login');
  }
}
