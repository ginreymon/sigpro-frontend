import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, tap, Observable, shareReplay, finalize } from 'rxjs';
import { LoginRequest } from '../../models/auth/login-request';
import { ResetPwRequest } from '../../models/auth/reset-pw-request';
import { ConfirmPwRequest } from '../../models/auth/confirm-pw-request';
import { Router } from '@angular/router';
import { jwtDecode } from 'jwt-decode';
import { RegisterRequest } from '../../models/auth/register-request';
import { MenuService } from '../core/menu-service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private path: string = `${environment.BASE_API_URL}/auth`;

  private isAuthenticatedSubject = new BehaviorSubject<boolean>(this.hasToken());
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();
  private refreshInFlight$: Observable<any> | null = null;

  constructor(
    private http: HttpClient,
    private router: Router,
    private menuService: MenuService,
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

  logout(redirect = true) {
    localStorage.clear();
    this.menuService.clearDynamicRoutes();
    this.isAuthenticatedSubject.next(false);
    if (redirect) this.router.navigateByUrl('/login');
  }

  passwordRequest(data: ResetPwRequest): Observable<any> {
    return this.http.post(`${this.path}/password-reset-request/`, data);
  }

  confirmPassword(data: ConfirmPwRequest): Observable<any> {
    return this.http.post(`${this.path}/password-reset-confirm/`, data);
  }

  registerRequest(data: RegisterRequest): Observable<any> {
    return this.http.post(`${this.path}/register/`, data);
  }

  refreshToken(): Observable<any> {
    if (!this.refreshInFlight$) {
      this.refreshInFlight$ = this.http
        .post(`${this.path}/token/refresh/`, {
          refresh: this.getRefreshToken(),
        })
        .pipe(
          tap((res: any) => {
            this.setAccessToken(res.access);
            if (res.refresh) this.setRefreshToken(res.refresh);
          }),
          shareReplay(1),
          finalize(() => (this.refreshInFlight$ = null)),
        );
    }
    return this.refreshInFlight$;
  }

  hasAccess(optionId: number): Observable<any> {
    return this.http.get(`${this.path}/has-access/`, { params: { optionId } });
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

  getUser() {
    const token = this.getAccessToken();
    if (!token) return null;

    return jwtDecode<any>(token);
  }

  private hasToken(): boolean {
    return !!this.getAccessToken();
  }
}
