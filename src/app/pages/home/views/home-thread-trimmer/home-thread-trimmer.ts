import { NgComponentOutlet } from '@angular/common';
import { Component, Type, inject, OnInit, signal } from '@angular/core';
import { UiIcon } from '../../../../shared/elements/ui-icon/ui-icon';
import { UiButton } from '../../../../shared/elements/ui-button/ui-button';
import { HomeShiftSkeleton } from '../../../../shared/components/production/cards/home-shift-skeleton/home-shift-skeleton';
import { AreaPanelService } from '../../../../services/core/area-panel-service';
import { WorkSessionService } from '../../../../services/production/work-session-service';
import { WorkSession } from '../../../../models/production/work-session';
import { ShiftNavigationService } from '../../../../services/core/shift-navigation-service';

@Component({
  selector: 'app-home-thread-trimmer',
  imports: [UiIcon, UiButton, NgComponentOutlet, HomeShiftSkeleton],
  templateUrl: './home-thread-trimmer.html',
  styleUrl: './home-thread-trimmer.css',
})
export class HomeThreadTrimmer implements OnInit {
  readonly hasPendingSession = signal(false);
  readonly activeSession = signal<WorkSession | null>(null);
  readonly isLoading = signal(true);

  private readonly area = 'production' as const;
  private areaPanel = inject(AreaPanelService);
  readonly shiftCard: Type<unknown> = this.areaPanel.config(this.area).shiftCard;
  private workSessionService = inject(WorkSessionService);
  private shiftNav = inject(ShiftNavigationService);

  goToShiftCycles() {
    this.activeSession() ? this.shiftNav.goToShiftCycles() : this.shiftNav.goToDayOperation();
  }

  readonly panelLabel = this.areaPanel.config(this.area).label;

  get canOpenPanel() {
    return this.areaPanel.canOpen(this.area);
  }

  goToAreaPanel() {
    this.areaPanel.open(this.area);
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
