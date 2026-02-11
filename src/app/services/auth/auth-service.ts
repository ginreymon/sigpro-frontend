import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment.development';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, tap, Observable } from 'rxjs';
import { LoginRequest } from '../../models/auth/login-request';
import { ResetPwRequest } from '../../models/auth/reset-pw-request';
import { ConfirmPwRequest } from '../../models/auth/confirm-pw-request';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private path: string = `${environment.BASE_API_URL}/auth`;

  private isAuthenticatedSubject = new BehaviorSubject<boolean>(this.hasToken());
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router,
  ) {}

  login(data: LoginRequest): Observable<any> {
    return this.http.post(`${this.path}/login/`, data).pipe(
      tap((res) => {
        if (res) {
          this.isAuthenticatedSubject.next(true);
        }
      }),
    );
  }

  logout() {
    localStorage.clear();
    this.isAuthenticatedSubject.next(false);
    this.router.navigateByUrl('/login');
  }

  passwordRequest(data: ResetPwRequest): Observable<any> {
    return this.http.post(`${this.path}/password-reset-request/`, data);
  }

  confirmPassword(data: ConfirmPwRequest): Observable<any> {
    return this.http.post(`${this.path}/password-reset-confirm/`, data);
  }

  refreshToken(): Observable<any> {
    return this.http.post(`${this.path}/token/refresh/`, {
      refresh: this.getRefreshToken(),
    });
  }

  setAccessToken(token: string) {
    localStorage.setItem(environment.ACCESS_TOKEN_NAME, token);
  }

  setRefreshToken(token: string) {
    localStorage.setItem(environment.REFRESH_TOKEN_NAME, token);
  }

  getAccessToken() {
    return localStorage.getItem(environment.ACCESS_TOKEN_NAME);
  }

  getRefreshToken() {
    return localStorage.getItem(environment.REFRESH_TOKEN_NAME);
  }

  private hasToken(): boolean {
    return !!this.getAccessToken();
  }
}
