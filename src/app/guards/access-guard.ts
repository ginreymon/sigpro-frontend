import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth/auth-service';
import { LoaderService } from '../services/common/loader-service';
import { catchError, finalize, map, of } from 'rxjs';

export const accessGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const loaderService = inject(LoaderService);

  const optionId = route.data?.['optionId'];

  if (!optionId) return true;

  loaderService.showLoader();

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
    // `finalize` runs even if a superseding navigation cancels/unsubscribes this
    // guard mid-flight — unlike the `map`/`catchError` callbacks above, which
    // only run on emission. Without this, a cancelled guard left the loader
    // stuck visible forever, blocking every future click behind its overlay.
    finalize(() => loaderService.hideLoader()),
  );
};
