import { Injectable, NgZone, inject, signal } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { jwtDecode } from 'jwt-decode';
import { filter, finalize } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth-service';

const ACTIVITY_EVENTS = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'wheel'];

const RENEW_AT_SECONDS = 300; // active user: renew silently when this close to expiry
const WARN_AT_SECONDS = 120; // idle user: show the warning modal when this close to expiry
const ACTIVE_WINDOW_MS = 60_000; // activity newer than this counts as "active now"
const RENEW_RETRY_MS = 30_000; // minimum gap between automatic renew attempts
const REASON_SYNC_MS = 150; // wait for the end-reason write that follows a cross-tab clear

/**
 * Idle-session control driven by the real `exp` of the access token (never a bare timer).
 * Activity never extends the session by itself: the timer only resets when the backend
 * confirms a refresh. Tabs stay in sync through the `storage` event (tokens live in localStorage).
 */
@Injectable({ providedIn: 'root' })
export class SessionService {
  private auth = inject(AuthService);
  private router = inject(Router);
  private zone = inject(NgZone);

  readonly warningVisible = signal(false);
  readonly secondsLeft = signal(0);

  private lastActivity = Date.now();
  private lastRenewAttempt = 0;
  private refreshing = false;
  private started = false;

  start() {
    if (this.started) return;
    this.started = true;

    this.zone.runOutsideAngular(() => {
      ACTIVITY_EVENTS.forEach((e) =>
        window.addEventListener(e, this.markActive, { passive: true }),
      );
      window.addEventListener('click', this.markActive, { passive: true });
      window.addEventListener('storage', this.onStorage);
      window.setInterval(() => this.tick(), 1000);
    });

    this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe(() => this.markActive());
  }

  /** True when the user did something within the given window. */
  isActive(windowMs = ACTIVE_WINDOW_MS): boolean {
    return Date.now() - this.lastActivity < windowMs;
  }

  /** "Continuar sesión": the warning closes only if the backend confirms the refresh. */
  continueSession() {
    this.renew();
  }

  /** "Cerrar sesión" from the warning modal. */
  logoutNow() {
    this.warningVisible.set(false);
    this.auth.logout();
  }

  // Activity is ignored while the warning is up: only the modal buttons can extend the session.
  private markActive = () => {
    if (!this.warningVisible()) this.lastActivity = Date.now();
  };

  private onStorage = (e: StorageEvent) => {
    const tokenKey = environment.ACCESS_TOKEN_NAME;
    if (e.key !== null && e.key !== tokenKey) return;

    if (this.auth.getAccessToken()) {
      // Another tab renewed the token: restart from the new `exp`.
      this.zone.run(() => {
        this.warningVisible.set(false);
        this.lastRenewAttempt = Date.now();
      });
      return;
    }

    // Another tab ended the session (storage cleared / token removed). The tab that ended it
    // writes the end reason right after clearing, and that second write can arrive after this
    // event, so give it a moment before reading it (logout() is single-flight anyway).
    window.setTimeout(
      () =>
        this.zone.run(() => {
          this.warningVisible.set(false);
          this.auth.logout(true, this.auth.getSessionEndReason());
        }),
      REASON_SYNC_MS,
    );
  };

  private expiryMs(): number | null {
    const token = this.auth.getAccessToken();
    if (!token) return null;
    try {
      const { exp } = jwtDecode<{ exp?: number }>(token);
      return exp ? exp * 1000 : null;
    } catch {
      return null; // malformed token: the interceptor's 401 handling is the authority
    }
  }

  private tick() {
    const expiry = this.expiryMs();
    if (expiry === null) return;

    const remaining = Math.floor((expiry - Date.now()) / 1000);

    if (remaining <= 0) {
      this.zone.run(() => {
        this.warningVisible.set(false);
        this.auth.expireSession();
      });
      return;
    }

    if (this.warningVisible()) {
      this.zone.run(() => this.secondsLeft.set(remaining));
      return;
    }

    const canAutoRenew = !this.refreshing && Date.now() - this.lastRenewAttempt > RENEW_RETRY_MS;
    if (remaining <= RENEW_AT_SECONDS && this.isActive() && canAutoRenew) {
      this.zone.run(() => this.renew());
      return;
    }

    if (remaining <= WARN_AT_SECONDS) {
      this.zone.run(() => {
        this.secondsLeft.set(remaining);
        this.warningVisible.set(true);
      });
    }
  }

  private renew() {
    if (this.refreshing) return;
    this.refreshing = true;
    this.lastRenewAttempt = Date.now();

    this.auth
      .refreshToken()
      .pipe(finalize(() => (this.refreshing = false)))
      .subscribe({
        next: () => {
          this.warningVisible.set(false);
          this.lastActivity = Date.now();
        },
        error: (err) => {
          // Rejected refresh = session is over. Network/5xx: keep state, the timer decides.
          if (err?.status === 401) {
            this.warningVisible.set(false);
            this.auth.expireSession();
          }
        },
      });
  }
}
