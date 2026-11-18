import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth/auth-service';
import { catchError, switchMap, throwError } from 'rxjs';
import { Router } from '@angular/router';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const accessToken = auth.getAccessToken();
  const router = inject(Router);
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
      if (error.status === 401) {
        // The refresh token is an HttpOnly cookie: the backend decides if it is still valid.
        return auth.refreshToken().pipe(
          switchMap((res: any) => {
            const newReq = req.clone({
              setHeaders: {
                Authorization: `Bearer ${res.access}`,
              },
            });

            return next(newReq);
          }),

          catchError((err) => {
            auth.logout();
            router.navigateByUrl('/login');
            return throwError(() => err);
          }),
        );
      }

      return throwError(() => error);
    }),
  );
};
