import { Component, EventEmitter, Input, Output, signal, ViewChild } from '@angular/core';
import { WorkShift } from '../../../models/production/work-shift';
import { ModalLayout } from '../modal-layout/modal-layout';
import { Searcher } from '../searcher/searcher';
import { UiFormField } from '../../elements/ui-form-field/ui-form-field';
import { UiOptionCard } from '../../elements/ui-option-card/ui-option-card';
import { UiIcon } from '../../elements/ui-icon/ui-icon';
import { UiErrorMessage } from '../../elements/ui-error-message/ui-error-message';
import { TitleCasePipe } from '@angular/common';
import { EllipsisPipe } from '../../../pipes/ellipsis-pipe';

@Component({
  selector: 'app-work-shift-modal',
  imports: [ModalLayout, Searcher, UiFormField, UiOptionCard, UiIcon, UiErrorMessage, TitleCasePipe, EllipsisPipe],
  templateUrl: './work-shift-modal.html',
})
export class WorkShiftModal {
  @Input() visible: boolean = false;
  @Input() set workShifts(value: WorkShift[]) {
    this._workShifts = value;
    this.filtered.set(value);
  }
  @Input('selectedId') set setSelectedId(value: number | null) {
    this._selectedId.set(value);
  }
  @Output() onSelect = new EventEmitter<WorkShift>();
  @Output() onClose = new EventEmitter<void>();

  @ViewChild('searcher') private searcher!: Searcher;

  private _workShifts: WorkShift[] = [];
  filtered = signal<WorkShift[]>([]);
  attempted = signal(false);
  _selectedId = signal<number | null>(null);

  isSelected(id: number): boolean {
    return this._selectedId() === id;
  }

  select(shift: WorkShift): void {
    if (this._selectedId() === shift.id) return;
    this._selectedId.set(shift.id);
  }

  search(text: string): void {
    const q = text?.toLowerCase().trim();
    this.filtered.set(!q
      ? this._workShifts
      : this._workShifts.filter(s =>
          s.name.toLowerCase().includes(q) ||
          s.start_time.includes(q) ||
          s.end_time.includes(q)
        )
    );
  }

  save(): void {
    if (!this._selectedId()) {
      this.attempted.set(true);
      return;
    }
    const shift = this._workShifts.find(s => s.id === this._selectedId());
    if (shift) this.onSelect.emit(shift);
    this.onClose.emit();
    this.attempted.set(false);
    this.searcher?.clear();
  }

  cancel(): void {
    this.attempted.set(false);
    this.onClose.emit();
    this.searcher?.clear();
  }
}
