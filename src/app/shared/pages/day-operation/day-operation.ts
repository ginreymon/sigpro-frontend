import { Component, computed, inject, Signal, signal } from '@angular/core';
import { WorkSpaceLayout } from '../../../layouts/work-space-layout/work-space-layout';
import { UiButton } from '../../elements/ui-button/ui-button';
import { BaseCrudPage } from '../../../common/classes/base-crud-page';
import { WorkSession, EmployeeSnapshot } from '../../../models/production/work-session';
import { WorkSessionService } from '../../../services/production/work-session-service';
import { CarouselField } from '../../components/form-controls/carousel-field/carousel-field';
import { UiFormField } from '../../elements/ui-form-field/ui-form-field';
import { UiIcon } from '../../elements/ui-icon/ui-icon';
import { WorkShift } from '../../../models/production/work-shift';
import { Module } from '../../../models/production/module';
import { Validators } from '@angular/forms';
import { minArrayLength } from '../../../common/functions/min-array-length';
import { parseSessionErrors } from '../../../common/functions/session-errors';
import { WorkShiftService } from '../../../services/production/work-shift-service';
import { ModuleService } from '../../../services/production/module-service';
import { EmployeeService } from '../../../services/production/employee-service';
import { RouteContextService } from '../../../services/core/route-context-service';
import { Employee } from '../../../models/production/employee';
import { EmployeesModal, EmployeesSavePayload } from '../../components/production/bottom-sheets/employees-modal/employees-modal';
import { EmployeePicker } from '../../components/production/widgets/employee-picker/employee-picker';
import { ReactiveFormsModule } from '@angular/forms';
import { finalize, forkJoin } from 'rxjs';
import { Router } from '@angular/router';
import { DayOperationDetail } from '../../components/production/cards/day-operation-detail/day-operation-detail';
import { UiAlert } from '../../elements/ui-alert/ui-alert';
import { ModuleOptionCard } from '../../components/production/cards/module-option-card/module-option-card';
import { WorkShiftOptionCard } from '../../components/production/cards/work-shift-option-card/work-shift-option-card';
import { FinalizeShiftMessage } from '../../components/production/widgets/finalize-shift-message/finalize-shift-message';
import { DayOperationConfig } from '../../../common/interfaces/day-operation-config';
import { DAY_OPERATION_CONFIG } from '../../../common/const/day-operation-config';
import { ShiftNavigationService } from '../../../services/core/shift-navigation-service';

const DEFAULT_CONFIG: DayOperationConfig = DAY_OPERATION_CONFIG['production'];

@Component({
  selector: 'app-day-operation',
  imports: [
    WorkSpaceLayout,
    UiButton,
    CarouselField,
    UiFormField,
    UiIcon,
    EmployeesModal,
    EmployeePicker,
    ReactiveFormsModule,
    DayOperationDetail,
    UiAlert,
    ModuleOptionCard,
    WorkShiftOptionCard,
    FinalizeShiftMessage,
  ],
  templateUrl: './day-operation.html',
  styleUrl: './day-operation.css',
})
export class DayOperation extends BaseCrudPage<WorkSession> {
  protected override entityName: string = 'Operación';

  private workShiftService = inject(WorkShiftService);
  private moduleService = inject(ModuleService);
  private employeeService = inject(EmployeeService);
  private routeContextService = inject(RouteContextService);
  private router = inject(Router);
  private shiftNav = inject(ShiftNavigationService);

  private config: DayOperationConfig =
    DAY_OPERATION_CONFIG[this.routeContextService.currentModule?.url ?? ''] ?? DEFAULT_CONFIG;

  protected moduleLabel = this.config.moduleLabel;
  protected summaryDescription = this.config.summaryDescription;
  protected planningDescription = this.config.planningDescription;

  protected get moduleLabelPlural(): string {
    return this.moduleLabel.toLowerCase() + 's';
  }

  protected modules = signal<Module[]>([]);
  protected workShifts = signal<WorkShift[]>([]);
  protected employees = signal<Employee[]>([]);
  protected currentSession = signal<WorkSession | null>(null);
  protected sessionCopy = signal<WorkSession | null>(null);
  protected initialDataLoaded = signal(false);
  protected displayError!: Signal<string | null>;

  constructor(private workSessionService: WorkSessionService) {
    super(workSessionService);
    this.displayError = computed(() => this.errorMessage());
    this.initialize();
  }

  initialize() {
    const coreModuleId = this.routeContextService.currentModule?.id;
    const scopeParams = coreModuleId ? { core_module_id: coreModuleId } : undefined;

    this.wslService.start();
    forkJoin({
      session: this.workSessionService.getActive(scopeParams),
      employees: this.employeeService.all(scopeParams),
    })
      .pipe(finalize(() => this.wslService.end()))
      .subscribe({
        next: ({ session, employees }) => {
          this.currentSession.set(session as WorkSession);
          if (session) this.setModelFormValues(session);
          this.employees.set(employees);
          this.initialDataLoaded.set(true);
        },
        error: () => {
          this.currentSession.set(null);
          this.initialDataLoaded.set(true);
          this.errorMessage.set('No se pudo cargar la información de la jornada. Intente de nuevo.');
        },
      });

    this.loadList(this.moduleService, this.modules, true, undefined, scopeParams);
    this.loadList(this.workShiftService, this.workShifts, true, undefined, scopeParams);
  }

  protected override initializeModelForm(): void {
    this.modelForm = this.fb.group({
      module_id: [null, [Validators.required]],
      work_shift_id: [null, [Validators.required]],
      employee_ids: this.fb.control<number[]>([], [minArrayLength(1)]),
      apprentice_ids: this.fb.control<number[]>([]),
    });
  }

  protected override reload(): void {}

  get moduleId() { return this.modelForm?.get('module_id'); }

  get workShiftId() { return this.modelForm?.get('work_shift_id'); }

  get employeeIds() { return this.modelForm?.get('employee_ids'); }

  get apprenticeIdsControl() { return this.modelForm?.get('apprentice_ids'); }

  get selectedModule() {
    return this.modules().find((m) => {
      return m.id == this.moduleId?.value;
    });
  }

  get selectedModuleIndex(): number | null {
    const index = this.modules().findIndex((m) => m.id === this.moduleId?.value);
    return index >= 0 ? index : null;
  }

  get selectedWorkShiftIndex(): number | null {
    const index = this.workShifts().findIndex((ws) => ws.id === this.workShiftId?.value);
    return index >= 0 ? index : null;
  }

  get assignedEmployees(): Employee[] {
    const ids: number[] = this.employeeIds?.value ?? [];
    return ids
      .map((id) => this.employees().find((e) => e.id === id))
      .filter((e): e is Employee => e !== undefined);
  }

  deleteEmployee(_id: number) {
    const filtered = this.employeeIds?.value.filter((id: number) => id !== _id);
    this.employeeIds?.setValue(filtered);
    const filteredApprentices = this.apprenticeIdsControl?.value.filter((id: number) => id !== _id);
    this.apprenticeIdsControl?.setValue(filteredApprentices);
  }

  toggleApprentice(id: number): void {
    const current: number[] = this.apprenticeIdsControl?.value ?? [];
    const updated = current.includes(id) ? current.filter((x) => x !== id) : [...current, id];
    this.apprenticeIdsControl?.setValue(updated);
  }

  openModal() {
    if (!this.selectedModule) {
      this.moduleId?.markAsTouched();
      return;
    }
    this.dialogService.openModal('Empleados', 'Agregar');
  }

  onEmployeesSaved({ ids, apprenticeIds }: EmployeesSavePayload): void {
    this.employeeIds?.setValue(ids);
    this.apprenticeIdsControl?.setValue(apprenticeIds.filter((id) => ids.includes(id)));
    this.dialogService.closeModal();
  }

  selectModule(id: number) {
    if (id == this.moduleId?.value) {
      this.moduleId.setValue(null);
      this.employeeIds?.setValue([]);
      this.apprenticeIdsControl?.setValue([]);
      return;
    }
    this.moduleId?.setValue(id);
    const ids = this.selectedModule?.employees?.map((e) => e.id);
    this.employeeIds?.setValue(ids ?? []);
    this.apprenticeIdsControl?.setValue([]);
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

  protected override closeModelForm(): void {
    this.prepareFormForAction();
    this.errorMessage.set(null);
    this.dialogService.closeModal();
  }

  protected override submit(): void {
    if (this.currentSession()) {
      this.shiftNav.goToShiftCycles();
      return;
    }

    if (!this.validateModelForm()) {
      this.errorMessage.set('Complete todos los campos requeridos para continuar.');
      return;
    }

    this.errorMessage.set(null);
    this.actionType = this.sessionCopy() ? 'edit' : 'create';
    this.rowObject.id = this.sessionCopy()?.id;

    super.submit(
      undefined,
      () => this.shiftNav.goToShiftCycles(),
      (err) => {
        const messages = parseSessionErrors(err, 'No se pudo crear la sesión de trabajo. Inténtalo nuevamente.');
        this.errorMessage.set(messages.join(' · '));
      },
    );
  }

  setModelFormValues(session: WorkSession) {
    this.modelForm.patchValue({
      module_id: session.current_module?.id,
      work_shift_id: session.work_shift?.id,
      employee_ids: session.employees_snapshot?.map((emp) => emp.id) ?? [],
      apprentice_ids: session.employees_snapshot
        ?.filter((emp: EmployeeSnapshot) => emp.is_apprentice)
        .map((emp: EmployeeSnapshot) => emp.id) ?? [],
    });
  }

  closeSession() {
    this.loaderService.showLoader();
    this.workSessionService
      .closeSession(this.currentSession()?.id!)
      .pipe(finalize(() => this.loaderService.hideLoader()))
      .subscribe({
        next: () => {
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
