import { Injectable, signal } from '@angular/core';
import { Location } from '@angular/common';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, tap, Observable, shareReplay, finalize, timeout } from 'rxjs';
import { LoginRequest } from '../../models/auth/login-request';
import { ResetPwRequest } from '../../models/auth/reset-pw-request';
import { ConfirmPwRequest } from '../../models/auth/confirm-pw-request';
import { Router } from '@angular/router';
import { jwtDecode } from 'jwt-decode';
import { RegisterRequest } from '../../models/auth/register-request';
import { MenuService } from '../core/menu-service';

const SESSION_END_REASON_KEY = 'session_end_reason';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private path: string = `${environment.BASE_API_URL}/auth`;

  private isAuthenticatedSubject = new BehaviorSubject<boolean>(this.hasToken());
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();
  private refreshInFlight$: Observable<any> | null = null;
  private loggingOut = false;
  /** True while a logout that ends in a redirect is running (drives the global overlay). */
  readonly loggingOutVisible = signal(false);

  constructor(
    private http: HttpClient,
    private router: Router,
    private menuService: MenuService,
    private location: Location,
  ) {}

  login(data: LoginRequest): Observable<any> {
    return this.http.post(`${this.path}/login/`, data).pipe(
      tap((res) => {
        if (res) {
          this.loggingOut = false;
          this.isAuthenticatedSubject.next(true);
        }
      }),
    );
  }

  /**
   * Ends the session locally and, best effort, blacklists the refresh token in the backend.
   * Single-flight: concurrent triggers (interceptor, idle timer, other tab) run it only once
   * until the next successful login. `reason` is shown on the login page.
   */
  logout(redirect = true, reason?: 'idle') {
    if (this.loggingOut) return;
    this.loggingOut = true;
    // Immediate visual feedback; stays up until the page load to /login replaces the app.
    if (redirect) this.loggingOutVisible.set(true);

    const refresh = this.getRefreshToken();

    localStorage.clear();
    // Lets other open tabs tell an idle expiry apart from a manual logout.
    if (reason) localStorage.setItem(SESSION_END_REASON_KEY, reason);
    this.menuService.clearDynamicRoutes();
    this.isAuthenticatedSubject.next(false);

    // Full page load instead of a router navigation: root-provided services keep per-user
    // in-memory state (production context, unsaved manual records, settings), and a reload
    // resets all of it without coupling auth to each store. Server-side jornadas are untouched.
    const goToLogin = () => {
      if (!redirect) return;
      const tree = this.router.createUrlTree(['/login'], reason ? { queryParams: { reason } } : {});
      window.location.assign(this.location.prepareExternalUrl(this.router.serializeUrl(tree)));
    };

    if (!refresh) return goToLogin();

    // Blacklist the refresh token first (bounded wait) so the page load cannot cancel the request.
    this.http
      .post(`${this.path}/logout/`, { refresh })
      .pipe(timeout(3000), finalize(goToLogin))
      .subscribe({ error: () => {} });
  }

  /** Session ended by inactivity or an unrecoverable authentication failure. */
  expireSession() {
    this.logout(true, 'idle');
  }

  /** Reason stored by the tab that ended the session, if any. */
  getSessionEndReason(): 'idle' | undefined {
    return localStorage.getItem(SESSION_END_REASON_KEY) === 'idle' ? 'idle' : undefined;
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
