import { Component, computed, inject, input, OnInit, Output, EventEmitter, signal } from '@angular/core';
import { BoxLayout } from '../box-layout/box-layout';
import { UiButton } from '../../elements/ui-button/ui-button';
import { UiOptionCard } from '../../elements/ui-option-card/ui-option-card';
import { UiErrorMessage } from '../../elements/ui-error-message/ui-error-message';
import { WorkBreakService } from '../../../services/production/work-break-service';
import { WorkBreak } from '../../../models/production/work-break';
import { finalize, map } from 'rxjs';
import { WorkSessionActivityService } from '../../../services/production/work-session-activity-service';
import { TaskTimerService } from '../../../services/common/task-timer-service';
import { PausePayload, WorkBreakRecord } from '../../../models/production/work-break-record';
import { LoaderService } from '../../../services/common/loader-service';
import { UiIcon } from "../../elements/ui-icon/ui-icon";
import { PauseModalService } from '../../../services/common/pause-modal-service';

@Component({
  selector: 'app-pause-modal',
  standalone: true,
  imports: [BoxLayout, UiButton, UiOptionCard, UiErrorMessage, UiIcon],
  templateUrl: './pause-modal.html',
})
export class PauseModal implements OnInit {
  private workBreakService = inject(WorkBreakService);
  private activityService = inject(WorkSessionActivityService);
  private loaderService = inject(LoaderService);
  private tts = inject(TaskTimerService);
  private pms = inject(PauseModalService);

  visible = input(false);
  protected isVisible = computed(() => this.visible() || this.pms.visible());
  preloadedWorkBreaks = input<WorkBreak[] | null | undefined>();
  @Output() onCancel = new EventEmitter<void>();
  @Output() onPause = new EventEmitter<WorkBreakRecord>();

  protected workBreaks = signal<WorkBreak[]>([]);

  ngOnInit(): void {
    const preloaded = this.preloadedWorkBreaks();
    if (preloaded?.length) this.workBreaks.set(preloaded);
    else this.workBreakService.getAll().pipe(map(r => r.results))
      .subscribe(breaks => this.workBreaks.set(breaks));
  }

  protected selectedBreak = signal<WorkBreak | null>(null);
  protected isCustomSelected = signal(false);
  protected customReason = signal('');
  protected touched = signal(false);

  get isValid(): boolean {
    return !!this.selectedBreak() || (this.isCustomSelected() && this.customReason().trim().length > 0);
  }

  selectBreak(wb: WorkBreak) {
    this.touched.set(true);
    this.isCustomSelected.set(false);
    this.selectedBreak.set(this.selectedBreak()?.id === wb.id ? null : wb);
  }

  selectCustom() {
    this.touched.set(true);
    this.selectedBreak.set(null);
    this.isCustomSelected.set(!this.isCustomSelected());
    if (!this.isCustomSelected()) this.customReason.set('');
  }

  cancel() {
    this.selectedBreak.set(null);
    this.isCustomSelected.set(false);
    this.customReason.set('');
    this.touched.set(false);
    this.onCancel.emit();
  }

  pause() {
    if (!this.isValid) return;
    const activityId = this.tts.activeActivityId();
    if (!activityId) return;

    const payload: PausePayload = this.selectedBreak()
      ? { work_break: this.selectedBreak()!.id }
      : { custom_reason: this.customReason().trim() };

    this.loaderService.showLoader();
    this.activityService.pause(activityId, payload)
      .pipe(finalize(() => this.loaderService.hideLoader()))
      .subscribe({
        next: (pause) => {        
          this.onPause.emit(pause);
          this.selectedBreak.set(null);
          this.isCustomSelected.set(false);
          this.customReason.set('');
          this.touched.set(false);
          this.tts.closePauseModal();
        },
      });
  }
}
