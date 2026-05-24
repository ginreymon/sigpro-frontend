import { Component, computed, EventEmitter, inject, Input, OnInit, Output, signal, ViewChild } from '@angular/core';
import { TitleCasePipe } from '@angular/common';
import { Employee } from '../../../models/production/employee';
import { ModalLayout } from '../modal-layout/modal-layout';
import { Searcher } from '../searcher/searcher';
import { UiFormField } from '../../elements/ui-form-field/ui-form-field';
import { UiOptionCard } from '../../elements/ui-option-card/ui-option-card';
import { UiIcon } from '../../elements/ui-icon/ui-icon';
import { UiErrorMessage } from '../../elements/ui-error-message/ui-error-message';
import { EmployeeService } from '../../../services/production/employee-service';
import { LoaderService } from '../../../services/common/loader-service';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-employees-modal',
  imports: [ModalLayout, Searcher, UiFormField, UiOptionCard, UiIcon, UiErrorMessage, TitleCasePipe],
  templateUrl: './employees-modal.html',
  styleUrl: './employees-modal.css',
})

export class EmployeesModal implements OnInit {
  @Input() visible: boolean = false;
  @Input() readOnly: boolean = false;
  @Input() fetch: Boolean = false;
  @Input() allowedCostCenters: number[] | null = null;
  @Output() onSave = new EventEmitter<number[]>();
  @Output() onClose = new EventEmitter<void>();

  @ViewChild('searcher') private searcher!: Searcher;

  @Input()
  set preselectedIds(ids: number[]) {
    this._preselectedIds = ids;
    this.selectedIds.set(ids);
  }

  @Input()
  set employees(emps: Employee[]) {
    this._employees.set(emps);
    this.filteredEmployees.set(this.sortEmployees());
  }

  private _employees = signal<Employee[]>([]);
  private _preselectedIds: number[] = [];
  private employeeService = inject(EmployeeService);
  private loaderService = inject(LoaderService);

  protected selectedIds = signal<number[]>([]);
  protected filteredEmployees = signal<Employee[]>([]);
  protected showOnlySelected = signal(false);
  protected attempted = signal(false);
  protected displayedEmployees = computed(() =>
    this.showOnlySelected()
      ? this.filteredEmployees().filter(e => this.selectedIds().includes(e.id))
      : this.filteredEmployees()
  );

  ngOnInit(): void {
    if (this.fetch) {
      this.fetchEmployees();
    }
  }

  private fetchEmployees() {
    this.loaderService.showLoader();
    this.employeeService.all()
      .pipe(finalize(() => this.loaderService.hideLoader()))
      .subscribe({
        next: (employees) => {
          const results = this.allowedCostCenters
            ? employees.filter(e => this.allowedCostCenters!.includes(e.cost_center_rowid!))
            : employees;
          this._employees.set(results);
          this.filteredEmployees.set(this.sortEmployees());
        },
      });
  }

  private sortEmployees(): Employee[] {
    return [...this._employees()].sort((a, b) => a.first_name.localeCompare(b.first_name));
  }

  isSelected(emp: Employee): boolean {
    return this.selectedIds().includes(emp.id);
  }

  toggle(id: number): void {
    if (this.readOnly) return;
    this.selectedIds.update(ids =>
      ids.includes(id) ? ids.filter(x => x !== id) : [...ids, id]
    );
    if (this.showOnlySelected() && this.selectedIds().length === 0) {
      this.showOnlySelected.set(false);
    }
  }

  search(text: string): void {
    const words = text?.toLowerCase().trim();
    this.filteredEmployees.set(!words
      ? this.sortEmployees()
      : this._employees().filter(
        (emp) =>
          emp.first_name.toLowerCase().includes(words) ||
          emp.last_name1.toLowerCase().includes(words) ||
          emp.last_name2?.toLowerCase().includes(words) ||
          emp.id_number.includes(words),
      ));
  }

  save(): void {
    if (this.selectedIds().length === 0) {
      this.attempted.set(true);
      return;
    }
    this.onSave.emit(this.selectedIds());
    this.onClose.emit();
    this.reset();
  }

  cancel(): void {
    this.selectedIds.set([...this._preselectedIds]);
    this.onClose.emit();
    this.reset();
  }

  private reset(): void {
    this.filteredEmployees.set(this.sortEmployees());
    this.showOnlySelected.set(false);
    this.attempted.set(false);
    this.searcher?.clear();
  }
}
