import { Component, EventEmitter, inject, Input, OnInit, Output, signal, ViewChild } from '@angular/core';
import { TitleCasePipe } from '@angular/common';
import { Employee } from '../../../models/production/employee';
import { DialogService } from '../../../services/common/dialog-service';
import { ModalLayout } from '../modal-layout/modal-layout';
import { Searcher } from '../searcher/searcher';
import { UiFormField } from '../../elements/ui-form-field/ui-form-field';
import { UiOptionCard } from '../../elements/ui-option-card/ui-option-card';
import { UiIcon } from '../../elements/ui-icon/ui-icon';
import { EmployeeService } from '../../../services/production/employee-service';
import { QueryParams } from '../../../common/interfaces/query-params';
import { LoaderService } from '../../../services/common/loader-service';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-employees-modal',
  imports: [ModalLayout, Searcher, UiFormField, UiOptionCard, UiIcon, TitleCasePipe],
  templateUrl: './employees-modal.html',
  styleUrl: './employees-modal.css',
})

export class EmployeesModal implements OnInit {
  @Input() readOnly: boolean = false;
  @Input() fetch: Boolean = false;
  @Output() onSave = new EventEmitter<number[]>();

  @ViewChild('searcher') private searcher!: Searcher;

  @Input()
  set preselectedIds(ids: number[]) {
    this.selectedIds = ids;
  }

  @Input()
  set employees(emps: Employee[]) {
    this._employees.set(emps);
    this.filteredEmployees.set(this.sortEmployees());
  }

  private _employees = signal<Employee[]>([]);
  private dialogService = inject(DialogService);
  private employeeService = inject(EmployeeService);
  private loaderService = inject(LoaderService);

  protected selectedIds: number[] = [];
  protected filteredEmployees = signal<Employee[]>([]);

  ngOnInit(): void {
    if (this.fetch) {
      this.fetchEmployees();
    }
  }

  private readonly ALLOWED_COST_CENTERS = [110, 103];

  private fetchEmployees() {
    this.loaderService.showLoader();
    const params: QueryParams = { page: 1, limit: 9999999 };
    this.employeeService.getAll(params)
      .pipe(finalize(() => this.loaderService.hideLoader()))
      .subscribe({
        next: (res) => {
          const filtered = res.results.filter(e => this.ALLOWED_COST_CENTERS.includes(e.cost_center_rowid!));
          this._employees.set(filtered);
          this.filteredEmployees.set(this.sortEmployees());
        },
      });
  }

  private sortEmployees(): Employee[] {
    return [...this._employees()].sort((a, b) => a.first_name.localeCompare(b.first_name));
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
    this.dialogService.closeModal();
    this.onSave.emit(this.selectedIds);
    this.reset();
  }

  cancel(): void {
    this.reset();
  }

  private reset(): void {
    this.filteredEmployees.set(this.sortEmployees());
    this.searcher?.clear();
  }
}
