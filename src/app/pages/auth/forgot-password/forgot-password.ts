import { Component } from '@angular/core';
import { AuthLayout } from '../../../layouts/auth-layout/auth-layout';
import { Router, RouterLink } from '@angular/router';
import { FormActionBtn } from '../../../shared/elements/form-action-btn/form-action-btn';
import { BaseAuthComponent } from '../../../common/classes/base-auth-component';
import { FormGroup, Validators, FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../../services/auth/auth-service';
import { finalize } from 'rxjs';
import { ResetPasswordService } from '../../../services/auth/reset-password-service';
import { ResetPwRequest } from '../../../models/auth/reset-pw-request';
import { LoaderService } from '../../../services/common/loader-service';
import { UiErrorMessage } from '../../../shared/elements/ui-error-message/ui-error-message';
import { UiFormField } from '../../../shared/elements/ui-form-field/ui-form-field';
import { UiInput } from '../../../shared/elements/ui-input/ui-input';
import { UiIcon } from '../../../shared/elements/ui-icon/ui-icon';

@Component({
  selector: 'app-forgot-password',
  imports: [AuthLayout, RouterLink, FormActionBtn, ReactiveFormsModule, UiErrorMessage, UiFormField, UiInput, UiIcon],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.css',
})
export class ForgotPassword extends BaseAuthComponent {
  requestForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router,
    private resetPassword: ResetPasswordService,
    private loaderService: LoaderService,
  ) {
    super();
    this.requestForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(5)]],
      idNumber: ['', [Validators.required, Validators.pattern(/^[0-9]{6,10}$/)]],
    });
  }

  get username() {
    return this.requestForm.get('username');
  }

  get idNumber() {
    return this.requestForm.get('idNumber');
  }

  send() {
    if (this.requestForm.invalid) {
      this.requestForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.loaderService.showLoader();

    const requestData: ResetPwRequest = {
      id_number: this.idNumber!.value,
      username: this.username!.value,
    };

    this.auth
      .passwordRequest(requestData)
      .pipe(finalize(() => { this.isLoading.set(false); this.loaderService.hideLoader(); }))
      .subscribe({
        next: (res) => {
          if (res.message) {
            this.errorMessage.set(res.message);
            return;
          }
          this.resetPassword.setToken(res.reset_token, res.expires_in_minutes);
          this.router.navigateByUrl('/confirm-password');
        },
        error: (err) => {
          this.errorMessage.set('Usuario y número de identificación no válidos');
        },
      });
  }
}
