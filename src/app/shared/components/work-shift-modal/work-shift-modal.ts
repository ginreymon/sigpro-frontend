import { Component, Input, ViewChild } from '@angular/core';
import { WorkShift } from '../../../models/production/work-shift';
import { ModalLayout } from '../modal-layout/modal-layout';
import { Searcher } from '../searcher/searcher';
import { UiFormField } from '../../elements/ui-form-field/ui-form-field';
import { UiOptionCard } from '../../elements/ui-option-card/ui-option-card';
import { UiIcon } from '../../elements/ui-icon/ui-icon';
import { UiErrorMessage } from '../../elements/ui-error-message/ui-error-message';
import { TitleCasePipe } from '@angular/common';
import { EllipsisPipe } from '../../../pipes/ellipsis-pipe';
import { BaseSingleSelectModal } from '../../../common/classes/base-single-select-modal';

@Component({
  selector: 'app-work-shift-modal',
  imports: [ModalLayout, Searcher, UiFormField, UiOptionCard, UiIcon, UiErrorMessage, TitleCasePipe, EllipsisPipe],
  templateUrl: './work-shift-modal.html',
})
export class WorkShiftModal extends BaseSingleSelectModal<WorkShift> {
  @ViewChild('searcher') protected override searcher!: Searcher;

  @Input() set workShifts(value: WorkShift[]) {
    this.setItems(value);
  }

  override search(text: string): void {
    const q = text?.toLowerCase().trim();
    this.filtered.set(!q
      ? this._items
      : this._items.filter(s =>
          s.name.toLowerCase().includes(q) ||
          s.start_time.includes(q) ||
          s.end_time.includes(q)
        )
    );
  }
}
