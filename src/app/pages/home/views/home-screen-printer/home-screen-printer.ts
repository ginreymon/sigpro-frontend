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
import { cloneWorkSession, isRecoverableSession } from '../../../../common/functions/continue-work-session';
import { DialogService } from '../../../../services/common/dialog-service';
import { LoaderService } from '../../../../services/common/loader-service';

@Component({
  selector: 'app-home-screen-printer',
  imports: [HomeOperatorHero, HomeMonthCard, HomeActionCard, HomeStateCard, HomeStampingShiftCard],
  templateUrl: './home-screen-printer.html',
  styleUrl: './home-screen-printer.css',
})
export class HomeScreenPrinter implements OnInit {
  readonly hasPendingSession = signal(false);
  readonly activeSession = signal<WorkSession | null>(null);
  /** Closed today without finalizing (logout): "Continuar" clones it instead of starting over. */
  readonly recoverableSession = signal<WorkSession | null>(null);
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
  private loaderService = inject(LoaderService);
  private dialogService = inject(DialogService);
  private router = inject(Router);

  /** Continue the open session as is, or start a new one. Never clones. */
  onAction(): void {
    if (this.activeSession()) this.router.navigateByUrl('stamping/shift-cycles');
    else this.router.navigateByUrl('stamping/day-operation');
  }

  /** Explicit "repeat previous session": clones the closed one, then opens shift-cycles. */
  onClone(): void {
    const recoverable = this.recoverableSession();
    // The loader overlay blocks clicks; this guards against a second click before it paints.
    if (!recoverable || this.loaderService.loaderVisible()) return;
    cloneWorkSession(this.workSessionService, this.loaderService, this.dialogService, recoverable.id, (session) => {
      this.activeSession.set(session);
      this.recoverableSession.set(null);
      this.router.navigateByUrl('stamping/shift-cycles');
    });
  }

  ngOnInit(): void {
    this.workSessionService.getLast(true).subscribe({
      next: (session) => {
        const recoverable = isRecoverableSession(session) ? session : null;
        this.activeSession.set(session && !session.is_closed ? session : null);
        this.recoverableSession.set(recoverable);
        this.hasPendingSession.set(!!this.activeSession());
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
