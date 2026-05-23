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
import { EmployeesModal } from '../../../shared/components/employees-modal/employees-modal';
import { UiTooltip } from '../../../shared/elements/ui-tooltip/ui-tooltip';
import { UiCloseButton } from '../../../shared/elements/ui-close-button/ui-close-button';
import { ReactiveFormsModule } from '@angular/forms';
import { finalize, forkJoin } from 'rxjs';
import { Router } from '@angular/router';
import { DayOperationDetail } from '../../../shared/components/day-operation-detail/day-operation-detail';

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
    EmployeesModal,
    UiTooltip,
    UiCloseButton,
    ReactiveFormsModule,
    DayOperationDetail,
  ],
  templateUrl: './day-operation.html',
  styleUrl: './day-operation.css',
})
export class DayOperation extends BaseCrudPage<WorkSession> {
  protected override entityName: string = 'Operación';
  @ViewChild('moduleCarousel') moduleCarousel!: OperationCarousel;
  @ViewChild('workshiftCarousel') workshiftCarousel!: OperationCarousel;

  private OPERATION_ORDER_URL: string = 'production/orders';
  private workShiftService = inject(WorkShiftService);
  private moduleService = inject(ModuleService);
  private employeeService = inject(EmployeeService);
  private router = inject(Router);

  protected modules = signal<Module[]>([]);
  protected workShifts = signal<WorkShift[]>([]);
  protected employees = signal<Employee[]>([]);
  protected currentSession = signal<WorkSession | null>(null);
  protected sessionCopy = signal<WorkSession | null>(null);

  constructor(private workSessionService: WorkSessionService) {
    super(workSessionService);
    this.initialize();
  }

  initialize() {
    this.wslService.start();
    forkJoin({
      session: this.workSessionService.getActive(),
      workShifts: this.workShiftService.getAll({ page: 1, limit: 1000000 }),
      modules: this.moduleService.getAll({ page: 1, limit: 1000000 }),
      employees: this.employeeService.getAll({ page: 1, limit: 1000000 }),
    })
      .pipe(finalize(() => this.wslService.end()))
      .subscribe({
        next: ({ session, workShifts, modules, employees }) => {
          this.currentSession.set(session as WorkSession);
          if (session) this.setModelFormValues(session);
          this.workShifts.set(workShifts.results.filter((e) => (e?.is_active ?? true) && !e?.is_deleted));
          this.modules.set(modules.results.filter((e) => (e?.is_active ?? true) && !e?.is_deleted));
          this.employees.set(employees.results);
        },
        error: () => this.currentSession.set(null),
      });
  }

  protected override initializeModelForm(): void {
    this.modelForm = this.fb.group({
      module_id: [null, [Validators.required]],
      work_shift_id: [null, [Validators.required]],
      employee_ids: this.fb.control<number[]>([], [minArrayLength(1)]),
    });
  }

  protected override reload(): void {}

  get moduleId() {
    return this.modelForm?.get('module_id');
  }

  get workShiftId() {
    return this.modelForm?.get('work_shift_id');
  }

  get employeeIds() {
    return this.modelForm?.get('employee_ids');
  }

  get selectedModule() {
    return this.modules().find((m) => {
      return m.id == this.moduleId?.value;
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
    if (!this.selectedModule) {
      this.moduleId?.markAsTouched();
      return;
    }
    this.dialogService.openModal('Empleados', 'Agregar');
  }

  onEmployeesSaved(ids: number[]): void {
    this.employeeIds?.setValue(ids);
  }

  selectModule(id: number) {
    if (id == this.moduleId?.value) {
      this.moduleId.setValue(null);
      this.employeeIds?.setValue([]);
      return;
    }
    this.moduleId?.setValue(id);
    const ids = this.selectedModule?.employees?.map((e) => {
      return e.id;
    });
    this.employeeIds?.setValue(ids ?? []);
  }

  isSelectedModule(mod: Module) {
    return this.moduleId?.value === mod.id;
  }

  selectWorkShift(id: number) {
    if (id == this.workShiftId?.value) {
      this.workShiftId.setValue(null);
      return;
    }
    this.workShiftId?.setValue(id);
  }

  isSelectedWorkShift(ws: WorkShift) {
    return this.workShiftId?.value === ws.id;
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

  protected override closeModelForm(): void {
    this.prepareFormForAction();
    this.errorMessage.set(null);
    this.dialogService.closeModal();
  }

  protected override submit(): void {
    if (this.currentSession()) {
      this.router.navigateByUrl(this.OPERATION_ORDER_URL);
      return;
    }

    this.actionType = this.sessionCopy() ? 'edit' : 'create';
    this.rowObject.id = this.sessionCopy()?.id;

    super.submit(undefined, () => {
      this.router.navigateByUrl(this.OPERATION_ORDER_URL);
      this.loaderService.hideLoader();
    });
  }

  setModelFormValues(session: WorkSession) {
    this.modelForm.patchValue({
      module_id: session.current_module?.id,
      work_shift_id: session.work_shift?.id,
      employee_ids: session.employees_snapshot?.map((emp) => {
        return emp.id;
      }),
    });
  }

  closeSession() {
    this.loaderService.showLoader();
    this.workSessionService
      .closeSession(this.currentSession()?.id!)
      .pipe(finalize(() => this.loaderService.hideLoader()))
      .subscribe({
        next: (value) => {
          this.currentSession.set(null);
          this.router.navigateByUrl('/');
        },
      });
  }

  switchEdit() {
    this.wslService.start();
    setTimeout(() => {
      this.sessionCopy.set(this.currentSession());
      this.currentSession.set(null);
      this.wslService.end();
    }, 300);
  }

  cancel() {
    if (!this.currentSession() && !this.sessionCopy()) {
      this.closeModelForm();
    } else {
      this.currentSession.set(this.sessionCopy());
      this.setModelFormValues(this.currentSession()!);
    }
  }
}
