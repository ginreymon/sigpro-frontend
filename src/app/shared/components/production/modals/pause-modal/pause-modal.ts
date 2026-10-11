import { Component, computed, effect, inject, input, OnInit, Output, EventEmitter, signal, Input } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { BoxLayout } from '../../../layout/box-layout/box-layout';
import { UiButton } from '../../../../elements/ui-button/ui-button';
import { UiOptionCard } from '../../../../elements/ui-option-card/ui-option-card';
import { UiErrorMessage } from '../../../../elements/ui-error-message/ui-error-message';
import { UiFormField } from '../../../../elements/ui-form-field/ui-form-field';
import { UiLargeInput } from '../../../../elements/ui-large-input/ui-large-input';
import { WorkBreakService } from '../../../../../services/production/work-break-service';
import { WorkBreak } from '../../../../../models/production/work-break';
import { finalize, map } from 'rxjs';
import { WorkSessionActivityService } from '../../../../../services/production/work-session-activity-service';
import { PausePayload, WorkBreakRecord } from '../../../../../models/production/work-break-record';
import { LoaderService } from '../../../../../services/common/loader-service';
import { DialogService } from '../../../../../services/common/dialog-service';
import { UiIcon } from "../../../../elements/ui-icon/ui-icon";
import { PauseModalService } from '../../../../../services/common/pause-modal-service';
import { RouteContextService } from '../../../../../services/core/route-context-service';
import { apiErrorDetail } from '../../../../../common/functions/api-error';

@Component({
  selector: 'app-pause-modal',
  standalone: true,
  imports: [BoxLayout, UiButton, UiOptionCard, UiErrorMessage, UiIcon, ReactiveFormsModule, UiFormField, UiLargeInput],
  templateUrl: './pause-modal.html',
})
export class PauseModal implements OnInit {
  private workBreakService = inject(WorkBreakService);
  private activityService = inject(WorkSessionActivityService);
  private loaderService = inject(LoaderService);
  private dialogService = inject(DialogService);
  private pms = inject(PauseModalService);
  private routeContextService = inject(RouteContextService);
  private fb = inject(FormBuilder);

  private currentModule = toSignal(this.routeContextService.module$, {
    initialValue: this.routeContextService.currentModule,
  });
  protected isStamping = computed(() => this.currentModule()?.url === 'stamping');

  visible = input(false);
  protected isVisible = computed(() => this.visible() || this.pms.visible());
  preloadedWorkBreaks = input<WorkBreak[] | null | undefined>();
  @Input() activityIdOverride?: number | null;
  @Output() onCancel = new EventEmitter<void>();
  @Output() onPause = new EventEmitter<WorkBreakRecord>();

  protected workBreaks = signal<WorkBreak[]>([]);

  // Motivo y minutos (custom) viven en un solo form. Los validators de cada control se
  // activan/desactivan según selección/ruta en el effect, no como validators estáticos en la
  // definición, para poder sumar más casos por módulo/ruta sin reescribir el form.
  protected pauseForm: FormGroup = this.fb.group({
    reason: [''],
    minutes: [null as number | null],
  });

  constructor() {
    effect(() => {
      const reason = this.pauseForm.get('reason')!;
      const minutes = this.pauseForm.get('minutes')!;

      reason.setValidators(this.isCustomSelected() ? [Validators.required] : []);
      minutes.setValidators(
        this.isCustomSelected() && this.isStamping() ? [Validators.required, Validators.min(1)] : [],
      );

      reason.updateValueAndValidity();
      minutes.updateValueAndValidity();
    });
  }

  ngOnInit(): void {
    const preloaded = this.preloadedWorkBreaks();
    if (preloaded?.length) this.workBreaks.set(preloaded);
    else this.workBreakService.getAll().pipe(map(r => r.results))
      .subscribe(breaks => this.workBreaks.set(breaks));
  }

  protected selectedBreak = signal<WorkBreak | null>(null);
  protected isCustomSelected = signal(false);
  protected touched = signal(false);

  get isValid(): boolean {
    if (this.selectedBreak()) return true;
    if (!this.isCustomSelected()) return false;
    return this.pauseForm.valid;
  }

  selectBreak(wb: WorkBreak) {
    this.markTouched();
    this.isCustomSelected.set(false);
    this.selectedBreak.set(this.selectedBreak()?.id === wb.id ? null : wb);
  }

  selectCustom() {
    this.markTouched();
    this.selectedBreak.set(null);
    this.isCustomSelected.set(!this.isCustomSelected());
    if (!this.isCustomSelected()) this.pauseForm.reset({ reason: '', minutes: null });
  }

  cancel() {
    this.selectedBreak.set(null);
    this.isCustomSelected.set(false);
    this.pauseForm.reset({ reason: '', minutes: null });
    this.touched.set(false);
    this.onCancel.emit();
  }

  pause() {
    this.markTouched();
    if (!this.isValid) return;
    const activityId = this.activityIdOverride ?? this.pms.activeActivityId();
    if (!activityId) return;

    const payload: PausePayload = this.selectedBreak()
      ? { work_break: this.selectedBreak()!.id }
      : {
          custom_reason: (this.pauseForm.value.reason as string).trim(),
          ...(this.isStamping() && this.pauseForm.value.minutes
            ? { work_break_minutes: this.pauseForm.value.minutes as number }
            : {}),
        };

    this.loaderService.showLoader();
    const pause$ = this.isStamping()
      ? this.activityService.pauseAutoResume(activityId, payload)
      : this.activityService.pause(activityId, payload);

    pause$
      .pipe(finalize(() => this.loaderService.hideLoader()))
      .subscribe({
        next: (pause) => {
          this.onPause.emit(pause);
          this.selectedBreak.set(null);
          this.isCustomSelected.set(false);
          this.pauseForm.reset({ reason: '', minutes: null });
          this.touched.set(false);
        },
        error: (err: HttpErrorResponse) => {
          const message = apiErrorDetail(err, 'Hubo un problema al intentar pausar la actividad.');
          this.dialogService.openToast('No se pudo pausar', message, 'fail');
        },
      });
  }

  private markTouched(): void {
    this.touched.set(true);
    this.pauseForm.markAllAsTouched();
  }
}
