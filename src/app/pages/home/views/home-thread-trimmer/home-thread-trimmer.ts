import { Component, inject, OnInit, signal } from '@angular/core';
import { HomeOperatorHero } from '../../../../shared/components/production/cards/home-operator-hero/home-operator-hero';
import { HomeMonthCard } from '../../../../shared/components/production/cards/home-month-card/home-month-card';
import { HomeActionCard } from '../../../../shared/components/production/cards/home-action-card/home-action-card';
import { HomeStateCard } from '../../../../shared/components/production/cards/home-state-card/home-state-card';
import { HomeProductionShiftCard } from '../../../../shared/components/production/cards/home-production-shift-card/home-production-shift-card';
import { WorkSessionService } from '../../../../services/production/work-session-service';
import { ProductivityService } from '../../../../services/production/productivity-service';
import { WorkSession } from '../../../../models/production/work-session';
import { cloneWorkSession, isRecoverableSession } from '../../../../common/functions/continue-work-session';
import { DialogService } from '../../../../services/common/dialog-service';
import { LoaderService } from '../../../../services/common/loader-service';
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
  /** Closed today without finalizing (logout): "Continuar" clones it instead of starting over. */
  readonly recoverableSession = signal<WorkSession | null>(null);
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
  private loaderService = inject(LoaderService);
  private dialogService = inject(DialogService);
  private shiftNav = inject(ShiftNavigationService);

  onAction(): void {
    // An open session is picked up by day-operation itself; only a closed one is cloned first.
    const recoverable = this.activeSession() ? null : this.recoverableSession();
    if (!recoverable) {
      this.shiftNav.goToDayOperation();
      return;
    }

    // The loader overlay blocks clicks; this guards against a second click before it paints.
    if (this.loaderService.loaderVisible()) return;
    cloneWorkSession(this.workSessionService, this.loaderService, this.dialogService, recoverable.id, (session) => {
      this.activeSession.set(session);
      this.recoverableSession.set(null);
      this.shiftNav.goToDayOperation();
    });
  }

  ngOnInit(): void {
    this.workSessionService.getLast(true).subscribe({
      next: (session) => {
        const recoverable = isRecoverableSession(session) ? session : null;
        this.activeSession.set(session && !session.is_closed ? session : null);
        this.recoverableSession.set(recoverable);
        this.hasPendingSession.set(!!this.activeSession() || !!recoverable);
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
