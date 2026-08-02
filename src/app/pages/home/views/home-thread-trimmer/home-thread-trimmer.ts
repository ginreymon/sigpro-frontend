import { Component, inject, OnInit, signal } from '@angular/core';
import { UiIcon } from '../../../../shared/elements/ui-icon/ui-icon';
import { UiButton } from '../../../../shared/elements/ui-button/ui-button';
import { HomeProductionShiftCard } from '../../../../shared/components/production/cards/home-production-shift-card/home-production-shift-card';
import { WorkSessionService } from '../../../../services/production/work-session-service';
import { WorkSession } from '../../../../models/production/work-session';
import { ShiftNavigationService } from '../../../../services/core/shift-navigation-service';

@Component({
  selector: 'app-home-thread-trimmer',
  imports: [UiIcon, UiButton, HomeProductionShiftCard],
  templateUrl: './home-thread-trimmer.html',
  styleUrl: './home-thread-trimmer.css',
})
export class HomeThreadTrimmer implements OnInit {
  readonly hasPendingSession = signal(false);
  readonly activeSession = signal<WorkSession | null>(null);
  readonly isLoading = signal(true);

  private workSessionService = inject(WorkSessionService);
  private shiftNav = inject(ShiftNavigationService);

  goToShiftCycles() {
    this.activeSession() ? this.shiftNav.goToShiftCycles() : this.shiftNav.goToDayOperation();
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
