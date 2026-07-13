import { Component, DestroyRef, effect, EventEmitter, inject, Input, OnChanges, OnDestroy, OnInit, Output, signal, SimpleChanges } from '@angular/core';
import { BoxLayout } from '../../../layout/box-layout/box-layout';
import { TimeProgressCircle } from '../../../widgets/time-progress-circle/time-progress-circle';
import { UiButton } from '../../../../elements/ui-button/ui-button';
import { UiIcon } from '../../../../elements/ui-icon/ui-icon';
import { AppConfigService } from '../../../../../services/core/app-config-service';
import { WorkSessionActivityService } from '../../../../../services/production/work-session-activity-service';
import { LoaderService } from '../../../../../services/common/loader-service';
import { WorkBreakRecord } from '../../../../../models/production/work-break-record';
import { WorkSession } from '../../../../../models/production/work-session';
import { ProductionRecord } from '../../../../../models/production/production-record';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ShiftModalsService } from '../../../../../services/common/shift-modals-service';
import { DialogService } from '../../../../../services/common/dialog-service';
import { DatePipe } from '@angular/common';
import { finalize } from 'rxjs';
import { OrderInfoBar } from '../../cards/order-info-bar/order-info-bar';
import { UiTooltip } from '../../../../elements/ui-tooltip/ui-tooltip';
import { ShiftCyclesActions } from "../shift-cycles-actions/shift-cycles-actions";

@Component({
  selector: 'app-shift-hourly-record',
  standalone: true,
  imports: [BoxLayout, TimeProgressCircle, UiButton, UiIcon, DatePipe, OrderInfoBar, UiTooltip, ShiftCyclesActions],
  templateUrl: './shift-hourly-record.html',
})
export class ShiftHourlyRecord implements OnInit, OnChanges, OnDestroy {
  @Input() enabled = false;
  @Input() activityId: number | null | undefined;
  @Input() activeBreak: WorkBreakRecord | null | undefined;
  @Input() currentSession: WorkSession | null | undefined;
  @Input() lastProductionRecord?: ProductionRecord | null;
  @Output() onFinalize = new EventEmitter<void>();
  @Output() onActivityPaused = new EventEmitter<WorkBreakRecord>();
  @Output() inWindowChange = new EventEmitter<boolean>();

  private appConfig = inject(AppConfigService);
  private activityService = inject(WorkSessionActivityService);
  private loaderService = inject(LoaderService);
  private destroyRef = inject(DestroyRef);
  private shiftModals = inject(ShiftModalsService);
  private dialogService = inject(DialogService);
  private settingEnabled = false;
  private keepOpenOnRegister = false;

  protected isOpen = signal(false);
  protected isTransparent = signal(false);
  protected isInWindow = signal(false);
  protected hourStart = signal<Date>(this.getHourStart());
  protected serverNow = signal<Date>(new Date());
  protected isPaused = signal(false);
  protected currentBreak = signal<WorkBreakRecord | null>(null);

  private intervalId?: ReturnType<typeof setInterval>;
  private wasInWindow = false;
  private registeredThisWindow = false;
  private windowSeconds = 300;

  protected get windowMinutes(): number {
    return Math.round(this.windowSeconds / 60);
  }

  protected get windowRange(): { start: string; end: string } {
    const nextHour = new Date(this.hourStart().getTime() + 3600_000);
    const start = new Date(nextHour.getTime() - this.windowSeconds * 1000);
    const end = new Date(nextHour.getTime() + this.windowSeconds * 1000);
    const fmt = (d: Date) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    return { start: fmt(start), end: fmt(end) };
  }

  constructor() {
    effect(() => {
      if (this.isOpen() && !this.isPaused()) {
        this.hourStart.set(this.getHourStart());
        this.serverNow.set(new Date());
      }
    });
    effect(() => this.shiftModals.setShiftHourlyVisible(this.isOpen()));
  }

  ngOnInit(): void {
    this.appConfig.load().subscribe(() => {
      this.settingEnabled = this.appConfig.showShiftHourlyComponent;
      this.windowSeconds = this.appConfig.shiftHourlyWindowSeconds;
      this.keepOpenOnRegister = this.appConfig.shiftHourlyKeepOpenOnRegister;
      if (this.activeBreak) {
        this.isPaused.set(true);
        this.currentBreak.set(this.activeBreak);
      }
      if (this.enabled && this.settingEnabled) this.startTimer();
    });
    this.shiftModals.pauseSaved$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(record => this.onPause(record));
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ('enabled' in changes) {
      this.enabled && this.settingEnabled ? this.startTimer() : this.stopTimer();
    }
    if ('activeBreak' in changes && !changes['activeBreak'].firstChange) {
      if (this.activeBreak) {
        this.isPaused.set(true);
        this.currentBreak.set(this.activeBreak);
        this.isOpen.set(true);
      } else {
        this.isPaused.set(false);
        this.currentBreak.set(null);
      }
    }
  }

  ngOnDestroy(): void {
    this.stopTimer();
    this.shiftModals.setShiftHourlyVisible(false);
  }

  protected register(): void {
    if (!this.isInWindow()) return;
    this.registeredThisWindow = true;
    this.isOpen.set(false);
  }

  public pause(): void {
    this.isOpen.set(true);
    this.shiftModals.openPause({ activityId: this.activityId });
  }

  protected onPause(record: WorkBreakRecord): void {
    this.isOpen.set(true);
    this.isPaused.set(true);
    this.currentBreak.set(record);
    this.onActivityPaused.emit(record);
  }

  protected resume(): void {
    if (!this.activityId) return;
    this.loaderService.showLoader();
    this.activityService.resume(this.activityId)
      .pipe(finalize(() => this.loaderService.hideLoader()))
      .subscribe({
        next: () => {
          this.isPaused.set(false);
          this.currentBreak.set(null);
          this.isOpen.set(true);
        },
        error: () => {
          this.isPaused.set(false);
          this.currentBreak.set(null);
          this.isOpen.set(true);
          this.dialogService.openToast('No se pudo reanudar', 'Hubo un problema al intentar reanudar la actividad.', 'fail');
        },
      });
  }

  protected onBreakExpired(): void {
    this.resume();
  }

  private getHourStart(): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), 0, 0, 0);
  }

  private startTimer(): void {
    this.stopTimer();
    this.hourStart.set(this.getHourStart());
    this.serverNow.set(new Date());
    const alreadyRegistered = this.isAlreadyRegisteredInCurrentWindow();
    const currentlyInWindow = this.computeInWindow();
    this.registeredThisWindow = alreadyRegistered && currentlyInWindow;
    this.wasInWindow = currentlyInWindow;
    const command = this.shiftModals.shiftHourlyOpen$.getValue();
    this.shiftModals.shiftHourlyOpen$.next(null);
    const openByCommand = this.keepOpenOnRegister && command === true;
    this.isOpen.set(openByCommand || this.isPaused() || !(currentlyInWindow && alreadyRegistered));
    this.tick();
    this.intervalId = setInterval(() => this.tick(), 1000);
  }

  private computeInWindow(): boolean {
    const now = new Date();
    const currentHourStart = this.getHourStart();
    const nextHour = new Date(currentHourStart.getTime() + 3600_000);
    const remainingSeconds = Math.floor((nextHour.getTime() - now.getTime()) / 1000);
    const elapsedInHour = Math.floor((now.getTime() - currentHourStart.getTime()) / 1000);
    return (remainingSeconds <= this.windowSeconds && remainingSeconds > 0) || elapsedInHour <= this.windowSeconds;
  }

  private isAlreadyRegisteredInCurrentWindow(): boolean {
    const record = this.lastProductionRecord;
    if (!record?.end_time) return false;
    const elapsed = Date.now() - new Date(record.end_time).getTime();
    return elapsed <= this.windowSeconds * 2 * 1000;
  }

  private setInWindow(value: boolean): void {
    this.isInWindow.set(value);
    this.inWindowChange.emit(value);
  }

  private stopTimer(): void {
    clearInterval(this.intervalId);
    this.intervalId = undefined;
    this.isOpen.set(false);
    this.setInWindow(false);
    this.wasInWindow = false;
    this.registeredThisWindow = false;
  }

  private tick(): void {
    const now = new Date();
    const currentHourStart = this.getHourStart();
    const nextHour = new Date(currentHourStart.getTime() + 3600_000);
    const remainingSeconds = Math.floor((nextHour.getTime() - now.getTime()) / 1000);
    const elapsedInHour = Math.floor((now.getTime() - currentHourStart.getTime()) / 1000);
    const inWindow = (remainingSeconds <= this.windowSeconds && remainingSeconds > 0) || elapsedInHour <= this.windowSeconds;

    if (currentHourStart.getTime() !== this.hourStart().getTime()) {
      this.hourStart.set(currentHourStart);
      this.serverNow.set(new Date(now));
      // wasInWindow and registeredThisWindow NOT reset here — the registration window
      // spans the hour boundary (e.g. 17:55–18:05), resetting at 18:00 would wrongly
      // reopen the component. Both flags are reset by the window-open/close blocks below.
    }

    if (inWindow && !this.wasInWindow) {
      this.wasInWindow = true;
      if (!this.registeredThisWindow) {
        this.isOpen.set(true);
      }
      this.registeredThisWindow = false;
    }

    if (!inWindow && elapsedInHour > this.windowSeconds && this.wasInWindow) {
      this.wasInWindow = false;
      this.registeredThisWindow = false;
    }

    this.setInWindow(inWindow);

    if (!inWindow && !this.isOpen() && !this.registeredThisWindow) {
      this.isOpen.set(true);
    }
  }

}
