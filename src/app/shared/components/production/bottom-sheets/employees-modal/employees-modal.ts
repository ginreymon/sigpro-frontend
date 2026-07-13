import { Component, computed, EventEmitter, inject, Input, OnInit, Output, signal, ViewChild } from '@angular/core';
import { Employee } from '../../../../../models/production/employee';
import { ModalLayout } from '../../../layout/modal-layout/modal-layout';
import { UiErrorMessage } from '../../../../elements/ui-error-message/ui-error-message';
import { UiFormField } from '../../../../elements/ui-form-field/ui-form-field';
import { EmployeeService } from '../../../../../services/production/employee-service';
import { LoaderService } from '../../../../../services/common/loader-service';
import { EmployeePicker } from '../../widgets/employee-picker/employee-picker';
import { finalize } from 'rxjs';

export interface EmployeesSavePayload {
  ids: number[];
  apprenticeIds: number[];
}

@Component({
  selector: 'app-employees-modal',
  imports: [ModalLayout, UiErrorMessage, UiFormField, EmployeePicker],
  templateUrl: './employees-modal.html',
  styleUrl: './employees-modal.css',
})
export class EmployeesModal implements OnInit {
  @Input() visible: boolean = false;
  @Input() readOnly: boolean = false;
  @Input() fetch: Boolean = false;
  @Input() allowedCostCenters: number[] | null = null;
  @Input() showApprenticeStatus: boolean = false;
  @Input() apprenticeEditable: boolean = false;
  @Output() onSave = new EventEmitter<EmployeesSavePayload>();
  @Output() onClose = new EventEmitter<void>();

  @ViewChild(EmployeePicker) private picker!: EmployeePicker;

  @Input()
  set preselectedIds(ids: number[]) {
    this._preselectedIds = ids;
    this.selectedIds.set(ids);
  }

  @Input()
  set employees(emps: Employee[]) {
    this._employees.set(emps);
  }

  @Input()
  set apprenticeIds(ids: number[]) {
    this._preselectedApprenticeIds = ids;
    this.currentApprenticeIds.set(ids);
  }

  private _employees   = signal<Employee[]>([]);
  private _preselectedIds: number[] = [];
  private _preselectedApprenticeIds: number[] = [];
  private employeeService = inject(EmployeeService);
  private loaderService   = inject(LoaderService);

  protected selectedIds = signal<number[]>([]);
  protected currentApprenticeIds = signal<number[]>([]);
  protected attempted   = signal(false);

  protected sortedEmployees = computed(() =>
    [...this._employees()].sort((a, b) => a.first_name.localeCompare(b.first_name)),
  );

  ngOnInit(): void {
    if (this.fetch) {
      this.fetchEmployees();
    }
  }

  private fetchEmployees(): void {
    this.loaderService.showLoader();
    this.employeeService
      .all()
      .pipe(finalize(() => this.loaderService.hideLoader()))
      .subscribe({
        next: (employees) => {
          const results = this.allowedCostCenters
            ? employees.filter((e) => this.allowedCostCenters!.includes(e.cost_center_rowid!))
            : employees;
          this._employees.set(results);
        },
      });
  }

  toggle(id: number): void {
    if (this.readOnly) return;
    this.selectedIds.update((ids) =>
      ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id],
    );
    if (!this.selectedIds().includes(id)) {
      this.currentApprenticeIds.update((ids) => ids.filter((x) => x !== id));
    }
  }

  toggleApprentice(id: number): void {
    this.currentApprenticeIds.update((ids) =>
      ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id],
    );
  }

  save(): void {
    if (this.selectedIds().length === 0) {
      this.attempted.set(true);
      return;
    }
    this.onSave.emit({ ids: this.selectedIds(), apprenticeIds: this.currentApprenticeIds() });
    this.onClose.emit();
    this.reset();
  }

  cancel(): void {
    this.selectedIds.set([...this._preselectedIds]);
    this.currentApprenticeIds.set([...this._preselectedApprenticeIds]);
    this.onClose.emit();
    this.reset();
  }

  private reset(): void {
    this.attempted.set(false);
    this.picker?.clear();
  }
}
