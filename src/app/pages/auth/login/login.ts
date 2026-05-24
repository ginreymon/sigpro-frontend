import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthLayout } from '../../../layouts/auth-layout/auth-layout';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth/auth-service';
import { LoginRequest } from '../../../models/auth/login-request';
import { LoaderService } from '../../../services/common/loader-service';
import { finalize } from 'rxjs/operators';
import { BaseAuthComponent } from '../../../common/classes/base-auth-component';
import { TogglePasswordBtn } from '../../../shared/elements/toggle-password-btn/toggle-password-btn';
import { FormActionBtn } from '../../../shared/elements/form-action-btn/form-action-btn';
import { UiErrorMessage } from '../../../shared/elements/ui-error-message/ui-error-message';
import { UiFormField } from '../../../shared/elements/ui-form-field/ui-form-field';
import { UiInput } from '../../../shared/elements/ui-input/ui-input';
import { UiIcon } from '../../../shared/elements/ui-icon/ui-icon';
import { Router } from '@angular/router';
import { MenuService } from '../../../services/core/menu-service';

@Component({
  selector: 'app-login',
  imports: [AuthLayout, RouterLink, ReactiveFormsModule, TogglePasswordBtn, FormActionBtn, UiErrorMessage, UiFormField, UiInput, UiIcon],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login extends BaseAuthComponent {
  loginForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router,
    private menu: MenuService,
    private loaderService: LoaderService,
  ) {
    super();
    this.loginForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(5)]],
      password: ['', [Validators.required, Validators.minLength(8)]],
    });
  }

  get username() {
    return this.loginForm.get('username');
  }

  get password() {
    return this.loginForm.get('password');
  }

  login() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.loaderService.showLoader();
    this.auth.logout();
    const loginData: LoginRequest = this.loginForm.value;

    this.auth.login(loginData)
    .pipe(finalize(() => { this.isLoading.set(false); this.loaderService.hideLoader(); }))
    .subscribe({
      next: (res) => {
        this.auth.setAccessToken(res.access);
        this.auth.setRefreshToken(res.refresh);       
        this.menu.loadMenu().subscribe({
          next: () => {
            this.router.navigateByUrl('/');
          },
        });
      },
      error: (error) => {
        this.errorMessage = 'Usuario o contraseña incorrectos';
      },
    });
  }
}
