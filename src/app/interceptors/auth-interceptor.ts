import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth/auth-service';
import { catchError, switchMap, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
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
      // Only 401 means "access token missing or expired". 400/403/5xx are business or
      // permission errors and pass through untouched. Without a session there is nothing to renew.
      if (error.status !== 401 || !auth.hasSession()) {
        return throwError(() => error);
      }

      // One shared refresh for all concurrent 401s (AuthService.refreshToken).
      return auth.refreshToken().pipe(
        // Handled before switchMap, so an error from the retried request is never taken
        // for a refresh failure. Only a definitive rejection ends the session; network
        // errors and 5xx keep it.
        catchError((err) => {
          if (auth.isSessionRejected(err)) auth.logout();
          return throwError(() => err);
        }),
        switchMap((res: any) =>
          next(req.clone({ setHeaders: { Authorization: `Bearer ${res.access}` } })),
        ),
      );
    }),
  );
};
