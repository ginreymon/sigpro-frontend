import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth/auth-service';
import { LoaderService } from '../services/common/loader-service';
import { catchError, map, of } from 'rxjs';

export const accessGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const loaderService = inject(LoaderService);

  const optionId = route.data?.['optionId'];

  if (!optionId) return true;

  loaderService.showLoader();

  return authService.hasAccess(optionId).pipe(
    map((res) => {
      loaderService.hideLoader();
      if (res.hasAccess) return true;

      router.navigate(['/not-authorized']);
      return false;
    }),
    catchError(() => {
      loaderService.hideLoader();
      router.navigate(['/']);
      return of(false);
    }),
  );
};
