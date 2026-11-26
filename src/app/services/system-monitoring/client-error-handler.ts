import { ErrorHandler, Injectable, Injector, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { timeout } from 'rxjs';
import { AuthService } from '../auth/auth-service';
import { SystemMonitoringService } from './system-monitoring-service';

const MIN_INTERVAL_MS = 5000;

/** Keeps Angular's default console logging and reports uncaught UI errors to the
 *  monitoring endpoint. HTTP errors are skipped: the server already records them. */
@Injectable()
export class ClientErrorHandler implements ErrorHandler {
  private injector = inject(Injector); // resolved lazily: this handler is created before HttpClient/Auth
  private lastReport = 0;
  private reporting = false;

  handleError(error: unknown): void {
    console.error(error);
    if (error instanceof HttpErrorResponse || this.reporting) return;
    const now = Date.now();
    if (now - this.lastReport < MIN_INTERVAL_MS) return;
    this.lastReport = now;

    try {
      if (!this.injector.get(AuthService).hasSession()) return;
      const err = error as { message?: string; stack?: string } | null;
      this.reporting = true;
      this.injector
        .get(SystemMonitoringService)
        .reportClientError({
          message: String(err?.message ?? error).slice(0, 500),
          url: location.pathname, // path only: never query strings
          stack: String(err?.stack ?? '').slice(0, 1500),
        })
        .pipe(timeout(10000)) // a POST that never settles must not mute later reports
        .subscribe({ error: () => (this.reporting = false), complete: () => (this.reporting = false) });
    } catch {
      this.reporting = false; // reporting must never throw back into the error handler
    }
  }
}
