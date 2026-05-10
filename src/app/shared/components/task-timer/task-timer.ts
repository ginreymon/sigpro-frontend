import { Component, computed, inject, Output, EventEmitter, Input, OnChanges, SimpleChanges, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { BoxLayout } from '../box-layout/box-layout';
import { UiButton } from '../../elements/ui-button/ui-button';
import { UiIcon } from '../../elements/ui-icon/ui-icon';
import { UiFormField } from '../../elements/ui-form-field/ui-form-field';
import { UiLargeInput } from '../../elements/ui-large-input/ui-large-input';
import { ProgressBar } from '../progress-bar/progress-bar';
import { TimeProgressCircle } from '../time-progress-circle/time-progress-circle';
import { SkuDetail } from '../sku-detail/sku-detail';
import { PauseModal } from '../pause-modal/pause-modal';
import { DatePipe } from '@angular/common';
import { SkuTaskDetail } from '../../../models/production/sku-task-detail';
import { TaskTimerService } from '../../../services/common/task-timer-service';
import { LoaderService } from '../../../services/common/loader-service';
import { finalize } from 'rxjs';
import { DialogService } from '../../../services/common/dialog-service';
import { WorkBreak } from '../../../models/production/work-break';
import { PauseResponse } from '../../../models/production/work-break-record';


@Component({
  selector: 'app-task-timer',
  standalone: true,
  imports: [BoxLayout, UiButton, UiIcon, ProgressBar, TimeProgressCircle, SkuDetail, ReactiveFormsModule, UiFormField, UiLargeInput, PauseModal, DatePipe],
  templateUrl: './task-timer.html',
  styleUrl: './task-timer.css',
})
export class TaskTimer implements OnChanges {

  @Input() selectedSKU!: SkuTaskDetail | null;
  @Output() saved = new EventEmitter<void>();

  private tts = inject(TaskTimerService);
  private loaderService = inject(LoaderService);
  private fb = inject(FormBuilder);
  private dialogService = inject(DialogService);  

  recordForm: FormGroup;
  isSubmitting = signal(false);

  protected state = computed(() => ({
    isConfirmed: this.tts.isStarted(),
    showQuantityModal: this.tts.showQuantityModal(),
    showPauseModal: this.tts.showPauseModal(),
    currentRecord: this.tts.currentRecord(),
  }));

  protected startTime = computed(() => {
    const record = this.tts.currentRecord();
    return record ? new Date(record.start_time) : new Date();
  });

  protected serverNow = computed(() => {
    const record = this.tts.currentRecord();
    return record ? new Date(record.server_now) : new Date();
  });

  get isCompleted(): boolean {
    if (!this.selectedSKU) return false;
    return this.selectedSKU.completedQty >= this.selectedSKU.orderedQty;
  }  

  get title() {
    if (!this.state().isConfirmed)
      return 'Confirmar'

    if (this.state().isConfirmed && !this.state().showQuantityModal)
      return 'Tarea en Proceso';

    if (this.state().showQuantityModal)
      return 'Ingresar cantidades';

    return '';
  }

  toDoQuantity(): number {
    if (!this.selectedSKU) return 0;
    return Math.max(0, this.selectedSKU.orderedQty - this.selectedSKU.completedQty);
  }

  duration(): number {
    if (!this.selectedSKU) return 0;   
    return this.toDoQuantity() * 3600 / this.selectedSKU.baseRouteQuantity;
  }

  constructor() {
    this.recordForm = this.fb.group({
      completed_quantity: [0, [Validators.required, Validators.min(0)]],
      scrap_quantity: [0, [Validators.required, Validators.min(0)]],
      rejected_quantity: [0, [Validators.required, Validators.min(0)]],
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['selectedSKU']) {
      const currentRecord = this.tts.currentRecord();
      if (currentRecord && this.selectedSKU?.skuRowId === currentRecord.sku_rowid) return;
      this.tts.reset();
    }
  }

  cancel() {
    this.selectedSKU = null;
    this.tts.reset();
  }

  start() {
    if (!this.selectedSKU || this.isSubmitting()) return;
    this.isSubmitting.set(true);
    this.loaderService.showLoader();
    this.tts.start(this.selectedSKU)
      .pipe(finalize(() => {
        this.isSubmitting.set(false);
        this.loaderService.hideLoader();
      }))
      .subscribe({
        next: (record) => this.tts.confirm(record),
      });
  }

  deliver() {  
    this.recordForm.reset({ completed_quantity: 0, scrap_quantity: 0, rejected_quantity: 0, });    
    this.tts.openQuantityModal();
  }

  pause() {
    this.tts.openPauseModal();
  }

  cancelPause(){
    this.tts.closePauseModal();
  }

  setPause(pause: PauseResponse) {
    
  }

  cancelQuantity() {
    this.recordForm.reset({ completed_quantity: 0, scrap_quantity: 0, rejected_quantity: 0, });    
    this.tts.closeQuantityModal();
  } 

  saveQuantity() {
    if (this.isSubmitting()) return;
    this.isSubmitting.set(true);
    this.loaderService.showLoader();
    const record = this.tts.currentRecord();   
    if (!record?.id) return;
    this.tts.saveQuantity(record.id, { ...this.recordForm.value })
      .pipe(finalize(() => {
        this.isSubmitting.set(false);
        this.loaderService.hideLoader();
        this.selectedSKU = null;
      }))
      .subscribe({
        next: (rd) => {
          this.tts.reset();
          this.saved.emit();
          const completed = Math.trunc(rd.completed_quantity ?? 0);
          const rejected = Math.trunc(rd.rejected_quantity ?? 0);
          const scrap = Math.trunc(rd.scrap_quantity ?? 0);
          this.dialogService.openToast(
            'Guardado',
            `Completadas: ${completed} | Rechazadas: ${rejected} | Saldos: ${scrap}`,
            'check'
          );
        },
      });
  }
}