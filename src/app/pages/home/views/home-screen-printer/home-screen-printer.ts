import { Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { UiIcon } from '../../../../shared/elements/ui-icon/ui-icon';
import { UiButton } from '../../../../shared/elements/ui-button/ui-button';
import { HomeStampingShiftCard } from '../../../../shared/components/production/cards/home-stamping-shift-card/home-stamping-shift-card';
import { WorkSessionService } from '../../../../services/production/work-session-service';
import { WorkSession } from '../../../../models/production/work-session';

@Component({
  selector: 'app-home-screen-printer',
  imports: [UiIcon, UiButton, HomeStampingShiftCard],
  templateUrl: './home-screen-printer.html',
  styleUrl: './home-screen-printer.css',
})
export class HomeScreenPrinter implements OnInit {
  readonly hasPendingSession = signal(false);
  readonly activeSession = signal<WorkSession | null>(null);
  readonly isLoading = signal(true);

  private workSessionService = inject(WorkSessionService);
  private router = inject(Router);

  goToShiftCycles() {
    this.router.navigateByUrl(this.activeSession() ? 'stamping/shift-cycles' : 'stamping/day-operation');
  }

  ngOnInit(): void {
    this.workSessionService.getActive().subscribe({
      next: (session: WorkSession | null) => {
        this.activeSession.set(session);
        this.hasPendingSession.set(!!session);
        this.isLoading.set(false);
      },
      error: () => {
        this.activeSession.set(null);
        this.hasPendingSession.set(false);
        this.isLoading.set(false);
      },
    });
  }
}
