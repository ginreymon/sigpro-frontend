import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import {
  BehaviorSubject,
  tap,
  Observable,
  shareReplay,
  finalize,
  firstValueFrom,
  catchError,
  of,
} from 'rxjs';
import { LoginRequest } from '../../models/auth/login-request';
import { ResetPwRequest } from '../../models/auth/reset-pw-request';
import { ConfirmPwRequest } from '../../models/auth/confirm-pw-request';
import { Router } from '@angular/router';
import { jwtDecode } from 'jwt-decode';
import { RegisterRequest } from '../../models/auth/register-request';
import { MenuService } from '../core/menu-service';
import { persistApiBaseUrl, SESSION_HINT_KEY } from '../core/api-base-url-initializer';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  // Read lazily: BASE_API_URL is resolved by an app initializer after this service may be created.
  private get path(): string {
    return `${environment.BASE_API_URL}/auth`;
  }

  // The access token lives only in memory. The refresh token is an HttpOnly cookie
  // managed by the browser and the backend; JavaScript never reads it.
  private accessToken: string | null = null;

  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();
  private refreshInFlight$: Observable<any> | null = null;

  constructor(
    private http: HttpClient,
    private router: Router,
    private menuService: MenuService,
  ) {}

  login(data: LoginRequest): Observable<any> {
    return this.http.post<any>(`${this.path}/login/`, data, { withCredentials: true }).pipe(
      tap((res) => {
        if (res?.access) {
          this.accessToken = res.access;
          this.isAuthenticatedSubject.next(true);
          // logout() clears localStorage; re-save the host that now holds the refresh cookie.
          persistApiBaseUrl();
          this.setSessionHint();
        }
      }),
    );
  }

  /**
   * Clears the local session. `revokeServerSession` also asks the backend to delete the
   * refresh cookie; skip it right before a login so the two requests cannot race.
   */
  logout(redirect = true, revokeServerSession = true) {
    if (revokeServerSession) {
      this.http
        .post(`${this.path}/logout/`, {}, { withCredentials: true })
        .subscribe({ error: () => {} });
    }
    this.accessToken = null;
    localStorage.clear();
    this.menuService.clearDynamicRoutes();
    this.isAuthenticatedSubject.next(false);
    if (redirect) this.router.navigateByUrl('/login');
  }

  /** App startup: recovers the in-memory access token from the refresh cookie. */
  restoreSession(): Promise<void> {
    // No hint and no legacy token: there is no session to restore, so skip the request
    // (it would only answer missing_refresh_token).
    if (!this.hasSessionHint() && !localStorage.getItem(environment.REFRESH_TOKEN_NAME)) {
      return Promise.resolve();
    }
    return firstValueFrom(this.refreshToken().pipe(catchError(() => of(null)))).then(() => {});
  }

  /** True when a session is, or probably is, active (in-memory token or refresh-cookie hint). */
  hasSession(): boolean {
    return !!this.accessToken || this.hasSessionHint();
  }

  /**
   * True only when the backend definitively rejected the refresh token (missing, invalid or
   * expired). Network failures and 5xx are temporary and must not end the session.
   */
  isSessionRejected(error: { status?: number }): boolean {
    return error?.status === 400 || error?.status === 401;
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
      // DUAL MODE: a session created before the cookie existed still has its refresh token
      // in localStorage; send it once so the backend can migrate it to the cookie.
      const legacyRefresh = localStorage.getItem(environment.REFRESH_TOKEN_NAME);

      this.refreshInFlight$ = this.http
        .post<any>(
          `${this.path}/token/refresh/`,
          legacyRefresh ? { refresh: legacyRefresh } : {},
          { withCredentials: true, headers: this.csrfHeader() },
        )
        .pipe(
          tap((res) => {
            this.accessToken = res.access;
            this.isAuthenticatedSubject.next(true);
            this.clearLegacyTokens();
            this.setSessionHint();
          }),
          tap({
            error: (err) => {
              if (this.isSessionRejected(err)) this.clearSessionHint();
            },
          }),
          // finalize before shareReplay: reset only when the HTTP call ends, not when one subscriber leaves.
          finalize(() => (this.refreshInFlight$ = null)),
          shareReplay(1),
        );
    }
    return this.refreshInFlight$;
  }

  hasAccess(optionId: number): Observable<any> {
    return this.http.get(`${this.path}/has-access/`, { params: { optionId } });
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  getUser() {
    const token = this.getAccessToken();
    if (!token) return null;

    return jwtDecode<any>(token);
  }

  // The backend sets the (non HttpOnly) csrftoken cookie; echo it in the header it validates.
  private csrfHeader(): Record<string, string> {
    const match = document.cookie.match(/(?:^|;\s*)csrftoken=([^;]+)/);
    return match ? { 'X-CSRFToken': decodeURIComponent(match[1]) } : {};
  }

  private hasSessionHint(): boolean {
    try {
      return !!localStorage.getItem(SESSION_HINT_KEY);
    } catch {
      return false;
    }
  }

  private setSessionHint() {
    try {
      localStorage.setItem(SESSION_HINT_KEY, '1');
    } catch {
      // Storage unavailable: the session still works until the next reload.
    }
  }

  private clearSessionHint() {
    try {
      localStorage.removeItem(SESSION_HINT_KEY);
    } catch {
      // Nothing to clear.
    }
  }

  private clearLegacyTokens() {
    localStorage.removeItem(environment.ACCESS_TOKEN_NAME);
    localStorage.removeItem(environment.REFRESH_TOKEN_NAME);
  }
}
