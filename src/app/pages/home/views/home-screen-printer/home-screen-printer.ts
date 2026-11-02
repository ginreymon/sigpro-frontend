import { Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { HomeOperatorHero } from '../../../../shared/components/production/cards/home-operator-hero/home-operator-hero';
import { HomeMonthCard } from '../../../../shared/components/production/cards/home-month-card/home-month-card';
import { HomeActionCard } from '../../../../shared/components/production/cards/home-action-card/home-action-card';
import { HomeStateCard } from '../../../../shared/components/production/cards/home-state-card/home-state-card';
import { HomeStampingShiftCard } from '../../../../shared/components/production/cards/home-stamping-shift-card/home-stamping-shift-card';
import { WorkSessionService } from '../../../../services/production/work-session-service';
import { StampingProductivityService } from '../../../../services/stamping/stamping-productivity-service';
import { WorkSession } from '../../../../models/production/work-session';

@Component({
  selector: 'app-home-screen-printer',
  imports: [HomeOperatorHero, HomeMonthCard, HomeActionCard, HomeStateCard, HomeStampingShiftCard],
  templateUrl: './home-screen-printer.html',
  styleUrl: './home-screen-printer.css',
})
export class HomeScreenPrinter implements OnInit {
  readonly hasPendingSession = signal(false);
  readonly activeSession = signal<WorkSession | null>(null);
  readonly isLoading = signal(true);
  readonly hasError = signal(false);
  /** Hero title: the module location once known, the process name meanwhile. */
  readonly heroTitle = signal('Estampación');
  readonly heroDescription = signal<string | null>(null);

  readonly heroLoading = signal(true);

  onLocation(location: { name: string; description: string | null } | null): void {
    this.heroLoading.set(false);
    if (!location) return;
    this.heroTitle.set(location.name);
    this.heroDescription.set(location.description);
  }

  readonly productivityService = inject(StampingProductivityService);
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
        this.hasError.set(true);
        this.activeSession.set(null);
        this.hasPendingSession.set(false);
        this.isLoading.set(false);
      },
    });
  }
}
