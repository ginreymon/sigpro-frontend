import { Component, computed, effect, inject } from '@angular/core';
import { BoxLayout } from '../../layout/box-layout/box-layout';
import { UiButton } from '../../../elements/ui-button/ui-button';
import { UiLoader } from '../../../elements/ui-loader/ui-loader';
import { SessionService } from '../../../../services/auth/session-service';
import { AuthService } from '../../../../services/auth/auth-service';

@Component({
  selector: 'app-session-expiry-modal',
  imports: [BoxLayout, UiButton, UiLoader],
  templateUrl: './session-expiry-modal.html',
})
export class SessionExpiryModal {
  protected session = inject(SessionService);
  protected auth = inject(AuthService);

  protected timeLeft = computed(() => {
    const s = this.session.secondsLeft();
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  });

  constructor() {
    // While logging out, the app content is inert: no clicks, focus or keyboard activation can
    // start requests or interrupt the process (the overlay alone only blocks the pointer).
    effect(() => {
      const busy = this.auth.loggingOutVisible();
      document
        .querySelectorAll('app-root > *:not(app-session-expiry-modal)')
        .forEach((el) => (el as HTMLElement).toggleAttribute('inert', busy));
    });
  }
}
