import { Component, computed, inject } from '@angular/core';
import { BoxLayout } from '../../layout/box-layout/box-layout';
import { UiButton } from '../../../elements/ui-button/ui-button';
import { SessionService } from '../../../../services/auth/session-service';

@Component({
  selector: 'app-session-expiry-modal',
  imports: [BoxLayout, UiButton],
  templateUrl: './session-expiry-modal.html',
})
export class SessionExpiryModal {
  protected session = inject(SessionService);

  protected timeLeft = computed(() => {
    const s = this.session.secondsLeft();
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  });
}
