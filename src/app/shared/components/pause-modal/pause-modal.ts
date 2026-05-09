import { Component, inject, Input, Output, EventEmitter, signal } from '@angular/core';
import { BoxLayout } from '../box-layout/box-layout';
import { UiButton } from '../../elements/ui-button/ui-button';
import { UiOptionCard } from '../../elements/ui-option-card/ui-option-card';
import { UiErrorMessage } from '../../elements/ui-error-message/ui-error-message';
import { toSignal } from '@angular/core/rxjs-interop';
import { WorkBreakService } from '../../../services/production/work-break-service';
import { WorkBreak } from '../../../models/production/work-break';
import { map } from 'rxjs';

@Component({
  selector: 'app-pause-modal',
  standalone: true,
  imports: [BoxLayout, UiButton, UiOptionCard, UiErrorMessage],
  templateUrl: './pause-modal.html',
})
export class PauseModal {
  private workBreakService = inject(WorkBreakService);

  @Input() visible = false;
  @Output() onCancel = new EventEmitter<void>();
  @Output() onConfirm = new EventEmitter<{ workBreak: WorkBreak | null; customReason: string }>();

  protected workBreaks = toSignal(
    this.workBreakService.getAll().pipe(map(r => r.results)),
    { initialValue: [] }
  );

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

  confirm() {
    if (!this.isValid) return;
    this.onConfirm.emit({
      workBreak: this.selectedBreak(),
      customReason: this.customReason(),
    });
  }
}
