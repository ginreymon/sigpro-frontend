import { Component, DestroyRef, EventEmitter, inject, Input, Output, ViewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TitleCasePipe } from '@angular/common';
import { Employee } from '../../../models/production/employee';
import { DialogService } from '../../../services/common/dialog-service';
import { ModalLayout } from '../modal-layout/modal-layout';
import { Searcher } from '../searcher/searcher';
import { UiFormField } from '../../elements/ui-form-field/ui-form-field';
import { UiOptionCard } from '../../elements/ui-option-card/ui-option-card';
import { UiIcon } from '../../elements/ui-icon/ui-icon';

@Component({
  selector: 'app-employees-modal',
  imports: [ModalLayout, Searcher, UiFormField, UiOptionCard, UiIcon, TitleCasePipe],
  templateUrl: './employees-modal.html',
  styleUrl: './employees-modal.css',
})
export class EmployeesModal {
  @Input() snapshot: Employee[] = [];
  @Input() preselectedIds: number[] = [];
  @Input() readOnly: boolean = false;
  @Output() onSave = new EventEmitter<number[]>();

  @ViewChild('searcher') private searcher!: Searcher;

  private dialogService = inject(DialogService);
  private destroyRef = inject(DestroyRef);

  selectedIds: number[] = [];
  filteredEmployees: Employee[] = [];

  constructor() {
    this.dialogService.modalVisible$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((visible) => {
        if (visible) {
          this.selectedIds = [...this.preselectedIds];
          this.filteredEmployees = this.sorted();
        }
      });
  }

  private sorted(): Employee[] {
    return [...this.snapshot].sort((a, b) => a.first_name.localeCompare(b.first_name));
  }

  isSelected(emp: Employee): boolean {
    return this.selectedIds.includes(emp.id);
  }

  toggle(id: number): void {
    if (this.readOnly) return;
    this.selectedIds = this.selectedIds.includes(id)
      ? this.selectedIds.filter((x) => x !== id)
      : [...this.selectedIds, id];
  }

  search(text: string): void {
    const words = text?.toLowerCase().trim();
    this.filteredEmployees = !words
      ? this.sorted()
      : this.snapshot.filter(
          (emp) =>
            emp.first_name.toLowerCase().includes(words) ||
            emp.last_name1.toLowerCase().includes(words) ||
            emp.last_name2?.toLowerCase().includes(words) ||
            emp.id_number.includes(words),
        );
  }

  save(): void {
    this.dialogService.closeModal();
    this.onSave.emit(this.selectedIds);
    this.reset();
  }

  cancel(): void {
    this.reset();
  }

  private reset(): void {
    this.filteredEmployees = this.sorted();
    this.searcher?.clear();
  }
}
