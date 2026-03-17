import { Component, inject, signal, ViewChild } from '@angular/core';
import { WorkSpaceLayout } from '../../../layouts/work-space-layout/work-space-layout';
import { UiButton } from '../../../shared/elements/ui-button/ui-button';
import { BaseCrudPage } from '../../../common/classes/base-crud-page';
import { WorkSession } from '../../../models/production/work-session';
import { WorkSessionService } from '../../../services/production/work-session-service';
import { OperationCarousel } from '../../../shared/components/operation-carousel/operation-carousel';
import { UiOptionCard } from '../../../shared/elements/ui-option-card/ui-option-card';
import { UiFormField } from '../../../shared/elements/ui-form-field/ui-form-field';
import { UiIcon } from '../../../shared/elements/ui-icon/ui-icon';
import { EllipsisPipe } from '../../../pipes/ellipsis-pipe';
import { TitleCasePipe } from '@angular/common';
import { UiErrorMessage } from '../../../shared/elements/ui-error-message/ui-error-message';
import { WorkShift } from '../../../models/production/work-shift';
import { Module } from '../../../models/production/module';
import { Validators } from '@angular/forms';
import { minArrayLength } from '../../../common/functions/min-array-length';
import { WorkShiftService } from '../../../services/production/work-shift-service';
import { ModuleService } from '../../../services/production/module-service';
import { EmployeeService } from '../../../services/production/employee-service';
import { Employee } from '../../../models/production/employee';
import { Loader } from '../../../shared/elements/loader/loader';
import { ModalLayout } from '../../../shared/components/modal-layout/modal-layout';
import { Searcher } from '../../../shared/components/searcher/searcher';
import { UiTooltip } from '../../../shared/elements/ui-tooltip/ui-tooltip';
import { UiCloseButton } from '../../../shared/elements/ui-close-button/ui-close-button';
import { ReactiveFormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { Router } from '@angular/router';

@Component({
  selector: 'app-day-operation',
  imports: [
    WorkSpaceLayout,
    UiButton,
    OperationCarousel,
    UiOptionCard,
    UiFormField,
    UiIcon,
    EllipsisPipe,
    TitleCasePipe,
    UiErrorMessage,
    Loader,
    ModalLayout,
    Searcher,
    UiTooltip,
    UiCloseButton,
    ReactiveFormsModule,
  ],
  templateUrl: './day-operation.html',
  styleUrl: './day-operation.css',
})
export class DayOperation extends BaseCrudPage<WorkSession> {
  @ViewChild('moduleCarousel') moduleCarousel!: OperationCarousel;
  @ViewChild('workshiftCarousel') workshiftCarousel!: OperationCarousel;
  @ViewChild('searcher') searcher!: Searcher;

  private OPERATION_ORDER_URL: string = 'production/orders';
  private workShiftService = inject(WorkShiftService);
  private moduleService = inject(ModuleService);
  private employeeService = inject(EmployeeService);
  private router = inject(Router);

  protected modules = signal<Module[]>([]);
  protected workShifts = signal<WorkShift[]>([]);
  protected employees = signal<Employee[]>([]);
  protected currentSession = signal<WorkSession | null>(null);
  private _filteredEmployees: Employee[] = [];
  selectedIds: number[] = [];

  constructor(private workSessionService: WorkSessionService) {
    super(workSessionService);
    this.loadList(this.workShiftService, this.workShifts, true);
    this.loadList(this.moduleService, this.modules, true);
    this.loadList(this.employeeService, this.employees, false);
    this.getCurrentSession();
  }

  protected override initializeModelForm(): void {
    this.modelForm = this.fb.group({
      module: [null, [Validators.required]],
      work_shift: [null, [Validators.required]],
      employee_ids: this.fb.control<number[]>([], [minArrayLength(1)]),
    });
  }

  protected override reload(): void {}

  get module() {
    return this.modelForm?.get('module');
  }

  get workShift() {
    return this.modelForm?.get('work_shift');
  }

  get employeeIds() {
    return this.modelForm?.get('employee_ids');
  }

  get filteredEmployees() {
    if (!this._filteredEmployees.length) {
      this._filteredEmployees = this.employees().sort((a, b) =>
        a.first_name.localeCompare(b.first_name),
      );
    }

    return this._filteredEmployees;
  }

  get selectedModule() {
    return this.modules().find((m) => {
      return m.id == this.module?.value;
    });
  }

  getEmployee(id: number) {
    return this.employees().find((e) => {
      return e.id == id;
    });
  }

  deleteEmployee(_id: number) {
    const filtered = this.employeeIds?.value.filter((id: number) => {
      return id != _id;
    });
    this.employeeIds?.setValue(filtered);
  }

  openModal() {
    if(!this.selectedModule){
      this.module?.markAsTouched();
      return;
    }
    this.selectedIds = this.employeeIds?.value ?? [];
    this.dialogService.openModal('Empleados', 'Agregar');
  }

  selectModule(id: number) {
    if (id == this.module?.value) {
      this.module.setValue(null);
      this.employeeIds?.setValue([]);
      return;
    }
    this.module?.setValue(id);
    const ids = this.selectedModule?.employees?.map((e) => {
      return e.id;
    });
    this.employeeIds?.setValue(ids ?? []);
  }

  isSelectedModule(mod: Module) {
    return this.module?.value === mod.id;
  }

  selectWorkShift(id: number) {
    if (id == this.workShift?.value) {
      this.workShift.setValue(null);
      return;
    }
    this.workShift?.setValue(id);
  }

  isSelectedWorkShift(ws: WorkShift) {
    return this.workShift?.value === ws.id;
  }

  isSelectedEmployee(emp: Employee) {
    return this.selectedIds.includes(emp.id);
  }

  nextModule() {
    this.moduleCarousel.next();
  }

  prevModule() {
    this.moduleCarousel.prev();
  }

  nextWorkshift() {
    this.workshiftCarousel.next();
  }

  prevWorkshift() {
    this.workshiftCarousel.prev();
  }

  search(text: string) {
    const words = text?.toLowerCase();
    this._filteredEmployees = !words?.trim()
      ? this.employees()
      : this.employees().filter((emp) => {
          return (
            emp.first_name.toLowerCase().includes(words) ||
            emp.last_name1.toLowerCase().includes(words) ||
            emp.last_name2?.toLowerCase().includes(words) ||
            emp.id_number.includes(words)
          );
        });
  }

  toggleEmployee(id: number) {
    const current = this.selectedIds;
    this.selectedIds = current.includes(id)
      ? current.filter((x: number) => x !== id)
      : [...current, id];
  }

  addEmployees() {
    this.employeeIds?.setValue(this.selectedIds);
    this.searcher.clear();
    this.dialogService.closeModal();
  }

  protected override closeModelForm(): void {
    this.resetModalForm();
    this.searcher.clear();
    this.selectedIds = [];
    this._filteredEmployees = this.employees();
    this.closeModelForm();
  }

  protected override submit(): void {
    if (this.currentSession()) {
      this.router.navigateByUrl(this.OPERATION_ORDER_URL);
      return;
    }

    this.actionType = 'create';
    super.submit(undefined, () => {
      this.router.navigateByUrl(this.OPERATION_ORDER_URL);
    });
  }

  getCurrentSession() {
    this.showLoader.set(true);
    this.workSessionService
      .getActive()
      .pipe(finalize(() => this.showLoader.set(false)))
      .subscribe({
        next: (session) => {
          this.currentSession.set(session as WorkSession);
        },
      });
  }

  closeSession() {
    this.showLoader.set(true);
    this.workSessionService
      .closeSession(this.currentSession()?.id!)
      .pipe(finalize(() => this.showLoader.set(false)))
      .subscribe({
        next: (value) => {
          this.currentSession.set(null);
          this.router.navigateByUrl('/');
        },
      });
  }
}
