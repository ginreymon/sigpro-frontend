import { Component, computed, inject, Signal, signal } from '@angular/core';
import { WorkSpaceLayout } from '../../../../layouts/work-space-layout/work-space-layout';
import { UiButton } from '../../../elements/ui-button/ui-button';
import { BaseCrudPage } from '../../../../common/classes/base-crud-page';
import { WorkSession, EmployeeSnapshot } from '../../../../models/production/work-session';
import { WorkSessionService } from '../../../../services/production/work-session-service';
import { CarouselField } from '../../../components/form-controls/carousel-field/carousel-field';
import { UiFormField } from '../../../elements/ui-form-field/ui-form-field';
import { UiIcon } from '../../../elements/ui-icon/ui-icon';
import { WorkShift } from '../../../../models/production/work-shift';
import { Module } from '../../../../models/production/module';
import { Validators } from '@angular/forms';
import { minArrayLength } from '../../../../common/functions/min-array-length';
import { extractFieldErrorMessage, parseSessionErrors } from '../../../../common/functions/session-errors';
import { WorkShiftService } from '../../../../services/production/work-shift-service';
import { ModuleService } from '../../../../services/production/module-service';
import { EmployeeService } from '../../../../services/production/employee-service';
import { RouteContextService } from '../../../../services/core/route-context-service';
import { Employee } from '../../../../models/production/employee';
import { EmployeesModal, EmployeesSavePayload } from '../../../components/production/modals/employees-modal/employees-modal';
import { EmployeePicker } from '../../../components/production/widgets/employee-picker/employee-picker';
import { ReactiveFormsModule } from '@angular/forms';
import { finalize, forkJoin } from 'rxjs';
import { Router } from '@angular/router';
import { DayOperationDetail } from '../../../components/production/cards/day-operation-detail/day-operation-detail';
import { UiAlert } from '../../../elements/ui-alert/ui-alert';
import { ModuleOptionCard } from '../../../components/production/cards/module-option-card/module-option-card';
import { WorkShiftOptionCard } from '../../../components/production/cards/work-shift-option-card/work-shift-option-card';
import { FinalizeShiftMessage } from '../../../components/production/widgets/finalize-shift-message/finalize-shift-message';
import { DayOperationConfig } from '../../../../common/interfaces/day-operation-config';
import { DAY_OPERATION_CONFIG } from '../../../../common/const/day-operation-config';
import { ShiftNavigationService } from '../../../../services/core/shift-navigation-service';
import { closeWorkSessionAndExit } from '../../../../common/functions/close-work-session';

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
  protected override entityName: string = 'Jornada';

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
    const moduleScopeParams = { ...scopeParams, for_day_operation: 'true' };

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

    this.wslService.start();
    this.moduleService
      .all(moduleScopeParams)
      .pipe(finalize(() => this.wslService.end()))
      .subscribe((modules) => {
        const activeModules = modules.filter((m) => (m?.is_active ?? true) && !m?.is_deleted);
        this.modules.set(activeModules);
        this.autoSelectAssignedModule(activeModules);
      });

    this.loadList(this.workShiftService, this.workShifts, true, undefined, scopeParams);
  }

  // Cuenta con módulo asociado (production_module_user_account): se preselecciona
  // y se salta el paso de selección manual, igual que el filtrado por production area.
  private autoSelectAssignedModule(modules: Module[]): void {
    if (modules.length === 1 && !this.moduleId?.value) {
      this.selectModule(modules[0].id);
    }
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
    const moduleEmployees = this.selectedModule?.employees ?? [];
    return ids
      .map(
        (id) =>
          this.employees().find((e) => e.id === id) ??
          this.toEmployeeStub(moduleEmployees.find((e) => e.id === id)),
      )
      .filter((e): e is Employee => e !== undefined);
  }

  // Mismo fallback que assignedEmployees: el módulo puede traer empleados fuera del
  // catálogo scoped por cost_center (ver EmployeeLocalViewSet.get_queryset), y sin
  // esto el modal los pierde silenciosamente aunque sigan en employee_ids.
  get modalEmployees(): Employee[] {
    const base = this.employees();
    const baseIds = new Set(base.map((e) => e.id));
    const moduleEmployees = this.selectedModule?.employees ?? [];
    const extras = moduleEmployees
      .filter((e) => !baseIds.has(e.id))
      .map((e) => this.toEmployeeStub(e))
      .filter((e): e is Employee => e !== undefined);
    return [...base, ...extras];
  }

  // Módulo puede traer empleados fuera del catálogo scoped por cost_center (ver EmployeeLocalViewSet.get_queryset);
  // sin este stub el picker los pierde silenciosamente aunque sigan en employee_ids.
  private toEmployeeStub(partial?: Partial<Employee>): Employee | undefined {
    if (!partial) return undefined;
    return {
      id_number: '',
      has_account: false,
      username: null,
      user_id: null,
      groups: [],
      is_account_active: false,
      company_name: null,
      contract_status: null,
      cost_center_rowid: null,
      cost_center_description: null,
      cost_group_id: null,
      cost_group_description: null,
      ...partial,
    } as unknown as Employee;
  }

  deleteEmployee(_id: number) {
    const module = this.selectedModule;
    const isAssigned = module?.employees?.some((e) => e.id === _id);
    if (!module || !isAssigned) {
      this.removeEmployeeFromForm(_id);
      return;
    }

    this.wslService.start();
    this.moduleService
      .removeEmployee(module.id, _id)
      .pipe(finalize(() => this.wslService.end()))
      .subscribe({
        next: ({ session_closed }) => {
          module.employees = module.employees?.filter((e) => e.id !== _id);
          this.removeEmployeeFromForm(_id);
          if (session_closed) {
            this.currentSession.set(null);
            this.sessionCopy.set(null);
          }
          this.dialogService.openToast('Proceso exitoso', 'Empleado eliminado de la lista correctamente', 'check');
          this.refreshFromServer();
        },
        error: (err) =>
          this.dialogService.openToast(
            'No se pudo eliminar',
            extractFieldErrorMessage(err) ?? 'No se pudo eliminar el empleado. Inténtalo nuevamente.',
            'fail',
          ),
      });
  }

  // Reloads modules and the active session so the screen reflects what the backend persisted.
  private refreshFromServer(): void {
    const coreModuleId = this.routeContextService.currentModule?.id;
    const scopeParams = coreModuleId ? { core_module_id: coreModuleId } : undefined;

    forkJoin({
      session: this.workSessionService.getActive(scopeParams),
      modules: this.moduleService.all({ ...scopeParams, for_day_operation: 'true' }),
    }).subscribe(({ session, modules }) => {
      this.modules.set(modules.filter((m) => (m?.is_active ?? true) && !m?.is_deleted));
      if (!session) return;
      if (this.sessionCopy()) this.sessionCopy.set(session as WorkSession);
      else this.currentSession.set(session as WorkSession);
    });
  }

  private removeEmployeeFromForm(_id: number) {
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
    closeWorkSessionAndExit(
      this.workSessionService,
      this.loaderService,
      this.router,
      this.currentSession()?.id!,
      this.currentSession,
    );
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
