import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth/auth-service';
import { catchError, map, of } from 'rxjs';

export const accessGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const optionId = route.data?.['optionId'];

  if (!optionId) return true;

  return authService.hasAccess(optionId).pipe(
    map((res) => {
      if (res.hasAccess) return true;

      router.navigate(['/not-authorized']);
      return false;
    }),
    catchError(() => {
      router.navigate(['/']);
      return of(false);
    }),
  );
};
