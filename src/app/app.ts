import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { UpdateService } from './services/common/update-service';
import { SessionService } from './services/auth/session-service';
import { UpdateAvailable } from './shared/components/notifications/update-available/update-available';
import { SessionExpiryModal } from './shared/components/notifications/session-expiry-modal/session-expiry-modal';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, UpdateAvailable, SessionExpiryModal],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('frontend');

  constructor() {
    inject(UpdateService).start();
    inject(SessionService).start();
  }
}
