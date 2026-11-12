import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { UpdateService } from './services/common/update-service';
import { UpdateAvailable } from './shared/components/notifications/update-available/update-available';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, UpdateAvailable],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('frontend');

  constructor() {
    inject(UpdateService).start();
  }
}
