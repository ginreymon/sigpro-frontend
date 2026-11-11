import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth/auth-service';
import { SessionService } from '../services/auth/session-service';
import { catchError, switchMap, throwError } from 'rxjs';

// Backend envelope codes of an authentication 401 (expired/invalid access token or none sent).
// Any other 401 is not an authentication failure and must not touch the session.
const AUTH_ERROR_CODES = ['token_not_valid', 'not_authenticated'];

// A 401 refresh is only honoured when the user was active recently, so background
// requests of an idle tab cannot keep the session alive.
const ACTIVE_WINDOW_MS = 5 * 60 * 1000;

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const session = inject(SessionService);
  const accessToken = auth.getAccessToken();
  let authReq = req;

  const publicUrls = [
    '/token/refresh',
    '/auth/login',
    '/auth/logout',
    '/auth/password-reset-request',
    '/auth/password-reset-confirm',
  ];

  const isPublic = publicUrls.some((url) => req.url.includes(url));

  if (isPublic) return next(req);

  if (accessToken) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      const isAuthError = error.status === 401 && AUTH_ERROR_CODES.includes(error.error?.code);
      if (!isAuthError) return throwError(() => error);

      if (!auth.getRefreshToken() || !session.isActive(ACTIVE_WINDOW_MS)) {
        auth.expireSession();
        return throwError(() => error);
      }

      return auth.refreshToken().pipe(
        // Only a rejected refresh (401) ends the session; network/5xx errors just propagate.
        catchError((err: HttpErrorResponse) => {
          if (err.status === 401) auth.expireSession();
          return throwError(() => err);
        }),
        // Errors of the retried request are not authentication failures of the refresh.
        switchMap((res: any) =>
          next(req.clone({ setHeaders: { Authorization: `Bearer ${res.access}` } })),
        ),
      );
    }),
  );
};
