import { Component, Input, ViewChild } from '@angular/core';
import { Module } from '../../../models/production/module';
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
  selector: 'app-module-modal',
  imports: [ModalLayout, Searcher, UiFormField, UiOptionCard, UiIcon, UiErrorMessage, TitleCasePipe, EllipsisPipe],
  templateUrl: './module-modal.html',
})
export class ModuleModal extends BaseSingleSelectModal<Module> {
  @ViewChild('searcher') protected override searcher!: Searcher;

  @Input() set modules(value: Module[]) {
    this.setItems(value);
  }

  override search(text: string): void {
    const q = text?.toLowerCase().trim();
    this.filtered.set(!q
      ? this._items
      : this._items.filter(m =>
          m.name.toLowerCase().includes(q) ||
          m.number.toString().includes(q) ||
          m.work_center?.description?.toLowerCase().includes(q)
        )
    );
  }
}
