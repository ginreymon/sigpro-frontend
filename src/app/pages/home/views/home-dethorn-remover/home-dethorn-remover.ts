import { Component, inject, OnInit, signal } from '@angular/core';
import { UiIcon } from '../../../../shared/elements/ui-icon/ui-icon';
import { UiButton } from '../../../../shared/elements/ui-button/ui-button';
import { HomeShiftCard } from '../../../../shared/components/home-shift-card/home-shift-card';
import { WorkSessionService } from '../../../../services/production/work-session-service';
import { WorkSession } from '../../../../models/production/work-session';

@Component({
  selector: 'app-home-dethorn-remover',
  imports: [UiIcon, UiButton, HomeShiftCard],
  templateUrl: './home-dethorn-remover.html',
  styleUrl: './home-dethorn-remover.css',
})
export class HomeDethornRemover implements OnInit {
  readonly hasPendingOperation = signal(false);
  readonly activeSession = signal<WorkSession | null>(null);
  readonly isLoading = signal(true);

  private workSessionService = inject(WorkSessionService);

  ngOnInit(): void {
    this.workSessionService.getActive().subscribe({
      next: (session: WorkSession) => {
        this.activeSession.set(session);
        this.hasPendingOperation.set(true);
        this.isLoading.set(false);
      },
      error: () => {
        this.activeSession.set(null);
        this.hasPendingOperation.set(false);
        this.isLoading.set(false);
      },
    });
  }
}
