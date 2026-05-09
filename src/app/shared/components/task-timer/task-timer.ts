import { Component, computed, effect, inject, Output, EventEmitter, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { BoxLayout } from '../box-layout/box-layout';
import { UiButton } from '../../elements/ui-button/ui-button';
import { UiIcon } from '../../elements/ui-icon/ui-icon';
import { UiFormField } from '../../elements/ui-form-field/ui-form-field';
import { UiLargeInput } from '../../elements/ui-large-input/ui-large-input';
import { TaskTimerService } from '../../../services/common/task-timer-service';
import { toSignal } from '@angular/core/rxjs-interop';
import { ProgressBar } from '../progress-bar/progress-bar';
import { TimeProgressCircle } from '../time-progress-circle/time-progress-circle';
import { ProductionRecordService } from '../../../services/production/production-record-service';
import { ProductionRecord } from '../../../models/production/production-record';
import { EMPTY, finalize, switchMap } from 'rxjs';
import { SkuDetail } from "../sku-detail/sku-detail";
import { TaskTimerState } from '../../../common/interfaces/task-timer-state';
import { WorkSessionService } from '../../../services/production/work-session-service';
import { LoaderService } from '../../../services/common/loader-service';
import { DialogService } from '../../../services/common/dialog-service';
import { PauseModal } from '../pause-modal/pause-modal';


@Component({
  selector: 'app-task-timer',
  standalone: true,
  imports: [BoxLayout, UiButton, UiIcon, ProgressBar, TimeProgressCircle, SkuDetail, ReactiveFormsModule, UiFormField, UiLargeInput, PauseModal],
  templateUrl: './task-timer.html',
  styleUrl: './task-timer.css',
})
export class TaskTimer {
  @Output() saved = new EventEmitter<void>();

  private tTService = inject(TaskTimerService);
  private recordService = inject(ProductionRecordService);
  private fb = inject(FormBuilder);
  private currentRecord = signal<ProductionRecord | null>(null);
  private workSessionService = inject(WorkSessionService);
  private loaderService = inject(LoaderService);
  protected loading = this.loaderService.loaderVisible;
  private dialogService = inject(DialogService);

  recordForm: FormGroup;

  protected state = toSignal(this.tTService.state$, {
    initialValue: this.tTService.state,
  });

  constructor() {
    this.recordForm = this.fb.group({
      completed_quantity: [0, [Validators.required, Validators.min(0)]],
      scrap_quantity: [0, [Validators.required, Validators.min(0)]],
      rejected_quantity: [0, [Validators.required, Validators.min(0)]],
    });

    effect(() => {
      const s = this.state();
      if (!s.showQuantityModal) return;

      const remaining = this.calcRemaining(s);
      const ctrl = this.recordForm.get('completed_quantity');
      ctrl?.setValidators([Validators.required, Validators.min(0), Validators.max(remaining)]);
      ctrl?.updateValueAndValidity();
      this.recordForm.reset({ completed_quantity: 0, scrap_quantity: 0, rejected_quantity: 0 });
    });
  }

  get title(): string {
    const s = this.state();

    if (s.showQuantityModal) return 'Cantidades';

    if (s.title) return s.title;

    if (this.isCompleted) return 'Progreso Finalizado';

    if (!s.isConfirmed) return 'Confirmar inicio';

    if (s.isConfirmed) return 'Progreso de Producción';

    return '';
  }

  get isCompleted(): boolean {
    const s = this.state();

    if (!s.selectedSKU) return false;

    const { completedQty, orderedQty } = s.selectedSKU;

    if (!completedQty || !orderedQty) return false;

    return completedQty >= orderedQty;
  }

  get remaining(): number {
    return this.calcRemaining(this.state());
  }

  protected serverNow = computed(() => this.currentRecord()?.server_now ?? new Date());

  protected startTime = computed(
    () => this.state().currentSession?.active_activity.last_open_production_record?.start_time ?? new Date()
  );

  buildRecord(): ProductionRecord {
    const s = this.state();
    return {
      op_number: s.currentOP?.documentNumber,
      op_type: s.currentOP?.documentType,
      op_rowid: s.currentOP?.rowId,
      sku_rowid: s.selectedSKU?.skuRowId,
      work_session_activity: s.currentSession?.active_activity.id,
      ordered_quantity: s.selectedSKU?.orderedQty,
      planned_quantity: s.selectedSKU?.plannedQty,
      completed_quantity: s.selectedSKU?.completedQty,
      scrap_quantity: s.selectedSKU?.wasteQty,
      rejected_quantity: s.selectedSKU?.rejectedQty,
    } as ProductionRecord;
  }

  cancel() {
    this.tTService.cancel();
  }

  start() {
    if (this.loading()) return;
    const s = this.state();
    if (this.isCompleted) return;
    if (s.currentSession?.active_activity.last_open_production_record) return;

    const record = this.buildRecord();
    this.loaderService.showLoader();
    this.recordService.create(record)
      .pipe(finalize(() => {
        this.loaderService.hideLoader();
        this.tTService.startTimer();
      }))
      .subscribe({
        next: (rd) => this.currentRecord.set(rd),
      });

    this.tTService.openDialog(s.rowColorDetail!, s.selectedSKU!, s.currentOP!, s.currentSession!);
  }

  deliver() {
    if (this.loading()) return;
    this.tTService.openQuantityModal();
  }

  cancelQuantity() {
    this.tTService.closeQuantityModal();
  }

  pause() {
    this.tTService.openPauseModal();
  }

  saveQuantity() {
    if (this.loading()) return;
    if (this.recordForm.invalid) return;

    const { completed_quantity, scrap_quantity, rejected_quantity } = this.recordForm.value;
    const s = this.state();

    this.loaderService.showLoader();
    this.workSessionService.getActive().pipe(
      switchMap((session) => {
        const record = session?.active_activity?.last_open_production_record;
        if (!record) return EMPTY;

        const payload = {
          ...this.buildRecord(),
          completed_quantity,
          scrap_quantity,
          rejected_quantity,
        };

        return this.recordService.update(record.id, payload);
      }),
      finalize(() => {
        this.tTService.closeQuantityModal();
        this.loaderService.hideLoader();
        this.saved.emit();
      })
    ).subscribe({
      next: () => {        
        this.dialogService.openToast(
          `Guardado`,
          `${s.currentOP?.reference} | ${s.rowColorDetail?.color} | Talla: ${s.selectedSKU?.size} | Completadas: ${completed_quantity} | Saldos: ${rejected_quantity} | Bajas: ${scrap_quantity}`,
          'check'
        );       
      },
    });
  }

  private calcRemaining(s: TaskTimerState): number {
    return Math.max(0, (s.selectedSKU?.orderedQty ?? 0) - (s.selectedSKU?.completedQty ?? 0));
  }
}
