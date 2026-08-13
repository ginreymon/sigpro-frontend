import { Router } from '@angular/router';
import { WritableSignal } from '@angular/core';
import { finalize } from 'rxjs';
import { LoaderService } from '../../services/common/loader-service';
import { WorkSessionService } from '../../services/production/work-session-service';
import { WorkSession } from '../../models/production/work-session';

/** Closes the active work session and returns to home. Shared by every page that offers "Cerrar día". */
export function closeWorkSessionAndExit(
  workSessionService: WorkSessionService,
  loaderService: LoaderService,
  router: Router,
  sessionId: number,
  currentSession: WritableSignal<WorkSession | null>,
): void {
  loaderService.showLoader();
  workSessionService.closeSession(sessionId)
    .pipe(finalize(() => loaderService.hideLoader()))
    .subscribe({
      next: () => {
        currentSession.set(null);
        router.navigateByUrl('/');
      },
    });
}
