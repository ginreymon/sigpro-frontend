import { finalize } from 'rxjs';
import { WorkSession } from '../../models/production/work-session';
import { DialogService } from '../../services/common/dialog-service';
import { LoaderService } from '../../services/common/loader-service';
import { WorkSessionService } from '../../services/production/work-session-service';
import { apiErrorDetail } from './api-error';
import { localTodayStr, utcIsoToLocalInput } from './date-utils';

/**
 * A closed session the user can pick up again from Home: started today and closed by
 * logout/manual close. An expired close also sets `editing_finalized` (the day is over),
 * so those are not recoverable. Without activities there is nothing to carry over.
 */
export function isRecoverableSession(session: WorkSession | null): session is WorkSession {
  return (
    !!session &&
    session.is_closed &&
    !session.editing_finalized &&
    session.modules?.length > 0 &&
    utcIsoToLocalInput(session.started_at)?.slice(0, 10) === localTodayStr()
  );
}

/** Clones a closed session through the backend (loader on) and hands the new one to `onCloned`. */
export function cloneWorkSession(
  workSessionService: WorkSessionService,
  loaderService: LoaderService,
  dialogService: DialogService,
  sessionId: number,
  onCloned: (session: WorkSession) => void,
): void {
  loaderService.showLoader();
  workSessionService
    .clone(sessionId)
    .pipe(finalize(() => loaderService.hideLoader()))
    .subscribe({
      next: onCloned,
      error: (err) =>
        dialogService.openToast(
          'Error',
          apiErrorDetail(err, 'No se pudo continuar la jornada. Intente de nuevo.'),
        ),
    });
}
