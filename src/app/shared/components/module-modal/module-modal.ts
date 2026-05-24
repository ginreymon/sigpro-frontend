import { Component, EventEmitter, Input, Output, signal, ViewChild } from '@angular/core';
import { Module } from '../../../models/production/module';
import { ModalLayout } from '../modal-layout/modal-layout';
import { Searcher } from '../searcher/searcher';
import { UiFormField } from '../../elements/ui-form-field/ui-form-field';
import { UiOptionCard } from '../../elements/ui-option-card/ui-option-card';
import { UiIcon } from '../../elements/ui-icon/ui-icon';
import { UiErrorMessage } from '../../elements/ui-error-message/ui-error-message';
import { TitleCasePipe } from '@angular/common';
import { EllipsisPipe } from '../../../pipes/ellipsis-pipe';

@Component({
  selector: 'app-module-modal',
  imports: [ModalLayout, Searcher, UiFormField, UiOptionCard, UiIcon, UiErrorMessage, TitleCasePipe, EllipsisPipe],
  templateUrl: './module-modal.html',
})
export class ModuleModal {
  @Input() visible: boolean = false;
  @Input() set modules(value: Module[]) {
    this._modules = value;
    this.filtered.set(value);
  }
  @Input('selectedId') set setSelectedId(value: number | null) {
    this._selectedId.set(value);
  }
  @Output() onSelect = new EventEmitter<Module>();
  @Output() onClose = new EventEmitter<void>();

  @ViewChild('searcher') private searcher!: Searcher;

  private _modules: Module[] = [];
  filtered = signal<Module[]>([]);
  attempted = signal(false);
  _selectedId = signal<number | null>(null);

  isSelected(id: number): boolean {
    return this._selectedId() === id;
  }

  select(module: Module): void {
    if (this._selectedId() === module.id) return;
    this._selectedId.set(module.id);
  }

  search(text: string): void {
    const q = text?.toLowerCase().trim();
    this.filtered.set(!q
      ? this._modules
      : this._modules.filter(m =>
          m.name.toLowerCase().includes(q) ||
          m.number.toString().includes(q) ||
          m.work_center?.description?.toLowerCase().includes(q)
        )
    );
  }

  save(): void {
    if (!this._selectedId()) {
      this.attempted.set(true);
      return;
    }
    const module = this._modules.find(m => m.id === this._selectedId());
    if (module) this.onSelect.emit(module);
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
