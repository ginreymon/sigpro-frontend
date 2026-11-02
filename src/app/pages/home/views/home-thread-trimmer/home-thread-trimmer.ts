import { Component, inject, OnInit, signal } from '@angular/core';
import { HomeOperatorHero } from '../../../../shared/components/production/cards/home-operator-hero/home-operator-hero';
import { HomeMonthCard } from '../../../../shared/components/production/cards/home-month-card/home-month-card';
import { HomeActionCard } from '../../../../shared/components/production/cards/home-action-card/home-action-card';
import { HomeStateCard } from '../../../../shared/components/production/cards/home-state-card/home-state-card';
import { HomeProductionShiftCard } from '../../../../shared/components/production/cards/home-production-shift-card/home-production-shift-card';
import { WorkSessionService } from '../../../../services/production/work-session-service';
import { ProductivityService } from '../../../../services/production/productivity-service';
import { WorkSession } from '../../../../models/production/work-session';
import { ShiftNavigationService } from '../../../../services/core/shift-navigation-service';

@Component({
  selector: 'app-home-thread-trimmer',
  imports: [HomeOperatorHero, HomeMonthCard, HomeActionCard, HomeStateCard, HomeProductionShiftCard],
  templateUrl: './home-thread-trimmer.html',
  styleUrl: './home-thread-trimmer.css',
})
export class HomeThreadTrimmer implements OnInit {
  readonly hasPendingSession = signal(false);
  readonly activeSession = signal<WorkSession | null>(null);
  readonly isLoading = signal(true);
  readonly hasError = signal(false);
  /** Hero title: the module location once known, the process name meanwhile. */
  readonly heroTitle = signal('Producción');
  readonly heroDescription = signal<string | null>(null);

  readonly heroLoading = signal(true);

  onLocation(location: { name: string; description: string | null } | null): void {
    this.heroLoading.set(false);
    if (!location) return;
    this.heroTitle.set(location.name);
    this.heroDescription.set(location.description);
  }

  readonly productivityService = inject(ProductivityService);
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
        this.hasError.set(true);
        this.activeSession.set(null);
        this.hasPendingSession.set(false);
        this.isLoading.set(false);
      },
    });
  }
}
