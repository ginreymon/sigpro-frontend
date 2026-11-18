import { Component, signal } from '@angular/core';
import { WorkSpaceLayout } from '../../../layouts/work-space-layout/work-space-layout';
import { DataTable } from '../../../shared/components/table/data-table/data-table';
import { EmployeeDirectoryService } from '../../../services/user/employee-directory-service';
import { SideModalLayout } from '../../../shared/components/layout/side-modal-layout/side-modal-layout';
import { ModalLayout } from '../../../shared/components/layout/modal-layout/modal-layout';
import { TableTemplate } from '../../../directives/table-template';
import { UiLabelButton } from '../../../shared/elements/ui-label-button/ui-label-button';
import { BaseCrudPage } from '../../../common/classes/base-crud-page';
import { RoleService } from '../../../services/user/role-service';
import { Role } from '../../../models/user/role';
import { UiFormField } from '../../../shared/elements/ui-form-field/ui-form-field';
import { UiOptionCard } from '../../../shared/elements/ui-option-card/ui-option-card';
import { ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../services/auth/auth-service';
import { UiInput } from '../../../shared/elements/ui-input/ui-input';
import { UiErrorMessage } from '../../../shared/elements/ui-error-message/ui-error-message';
import { UiTogglePasswordBtn } from '../../../shared/elements/ui-toggle-password-btn/ui-toggle-password-btn';
import { UiValidationIcon } from '../../../shared/elements/ui-validation-icon/ui-validation-icon';
import { RegisterRequest } from '../../../models/auth/register-request';
import { UserService } from '../../../services/user/user-service';
import { User } from '../../../models/user/user';
import { UiBadge } from "../../../shared/elements/ui-badge/ui-badge";
import { TableActionEvent } from '../../../common/interfaces/table-action-event';
import { CharSquare } from "../../../shared/components/widgets/char-square/char-square";
import { UiCombobox } from '../../../shared/elements/ui-combobox/ui-combobox';
import { TableColumn } from '../../../common/interfaces/table-column';
import { TitleCasePipe } from '@angular/common';


@Component({
  selector: 'app-users',
  imports: [
    WorkSpaceLayout,
    DataTable,
    TableTemplate,
    SideModalLayout,
    ModalLayout,
    UiLabelButton,   
    UiFormField,
    UiOptionCard,
    ReactiveFormsModule,
    UiInput,
    UiErrorMessage,
    UiTogglePasswordBtn,
    UiValidationIcon,
    UiBadge,
    CharSquare,
    UiCombobox,
    TitleCasePipe
],
  templateUrl: './users.html',
  styleUrl: './users.css',
})
export class Users extends BaseCrudPage<User> {
  protected override entityName: string = 'Usuario';  
  roles = signal<Role[]>([]);
  showPassword = signal<boolean>(false);
  employees = signal<{ id: number; label: string }[]>([]);

  constructor(
    private employeeDirectoryService: EmployeeDirectoryService,
    private roleService: RoleService,
    private authService: AuthService,
    private userService: UserService,
  ) {
    super(userService);
    this.loadList(this.roleService, this.roles, false);
  }

  protected override get actions() {
    return {
      ...super.actions,
      delete: { enabled: false },
    }
  }

  protected override get columns(): TableColumn<User>[] {
    return [
      { field: 'username', label: 'Usuario' },
      { field: 'email', label: 'Correo' },
      { type: 'template', label: 'Empleado', templateName: 'employeeTemplate' },
      { type: 'template', label: 'Rol', templateName: 'roleTemplate' },
      { type: 'template', label: 'Estado', templateName: 'userStatusTemplate' },
      { type: 'template', label: 'Acciones', templateName: 'accountActionTemplate', align: 'center' },
    ];
  }

  protected override initializeModelForm(): void {
    const passwordValidators =
      this.actionType == 'create' ? [Validators.required, Validators.minLength(8)] : [];

    this.modelForm = this.fb.group({
      username: [
        '',
        [Validators.required, Validators.minLength(8), Validators.pattern(/^[A-Za-z0-9._]+$/)],
      ],
      email: ['', [Validators.email]],
      employee_local_id: [null],
      password: [null, passwordValidators],
      confirmPassword: [null, passwordValidators],
      role: [null, Validators.required],
    });
  }

  get username() {
    return this.modelForm.get('username');
  }

  get employeeId() {
    return this.modelForm.get('employee_local_id');
  }

  get email() {
    return this.modelForm.get('email');
  }

  get password() {
    return this.modelForm.get('password');
  }

  get confirmPassword() {
    return this.modelForm.get('confirmPassword');
  }

  get role() {
    return this.modelForm.get('role');
  }

  get passwordsMatch() {
    return this.password?.value && this.password?.value === this.confirmPassword?.value;
  }

  protected override actionHandler(event: TableActionEvent<User>): void {
    super.actionHandler(event);

    if (event.type == 'create') {
      this.initializeModelForm();
      this.loadEmployees();
    }

    if (event.type == 'edit') {
      this.modelForm.patchValue({
        username: event.obj.username,
        email: event.obj.email ?? '',
        employee_local_id: event.obj.employee?.id ?? null,
        role: event.obj.groups[0]?.id ?? null,
      });
      this.loadEmployees(event.obj.id);
    }
  }

  private loadEmployees(userId?: number) {
    this.employeeDirectoryService.available(userId).subscribe((list) =>
      this.employees.set(
        list.map((e) => ({
          id: e.id,
          label: `${e.first_name} ${e.last_name1} - ${e.id_number}`,
        })),
      ),
    );
  }

  protected override submit(): void {
    if (!this.validateModelForm()) return;

    if ((this.actionType === 'create' || this.password?.value) && !this.passwordsMatch) {
      this.confirmPassword?.markAsTouched();
      return;
    }

    this.loaderService.showLoader();

    const { username, email, password, employee_local_id, role } = this.modelForm.value;
    const base = { username, email: email || null, employee_local_id: employee_local_id ?? null, group_id: role };

    const request$ =
      this.actionType == 'create'
        ? this.authService.registerRequest({ ...base, password } as RegisterRequest)
        : this.userService.update(this.rowObject.id!, { ...base, ...(password ? { password } : {}) });

    request$.subscribe({
      next: () => {
        this.closeModelForm();
        const actionText = this.actionType === 'create' ? 'creada' : 'actualizada';
        this.dialogService.openToast('Proceso exitoso', `La cuenta fue ${actionText} correctamente.`, 'check');
        this.reload(() => this.loaderService.hideLoader());
      },
      error: (err) => {
        this.loaderService.hideLoader();
        const hasFieldErrors = this.markServerFieldErrors(err);
        this.errorMessage.set(
          hasFieldErrors
            ? 'Uno o varios campos tienen errores. Revisa los campos marcados.'
            : 'Ocurrió un error. Intente nuevamente.',
        )
      },
    });
  }

  activateAccount(obj: User) {
    const label = obj.is_active ? 'Desactivar' : 'Activar';
    const title = `${label} cuenta`;
    this.dialogService.openConfirm(title, '¿Está seguro de realizar esta acción?', label, () => {
      this.loaderService.showLoader();
      const user: Partial<User> = { is_active: !obj.is_active };
      this.userService
        .update(obj.id, user)
        .subscribe({
          next: () => {
            this.dialogService.closeConfirm();
            const actionText = obj.is_active ? 'desactivada' : 'activada';
            this.dialogService.openToast('Proceso exitoso', `La cuenta "${obj.username}" fue ${actionText} correctamente.`, 'check');
            this.reload(() => this.loaderService.hideLoader());
          },
          error: () => {
            this.loaderService.hideLoader();
            this.dialogService.closeConfirm();
          },
        });
    });
  } 

  isSelected(id: number) {
    return this.role?.value == id;
  }

  toggleShowPassword(value: boolean) {
    this.showPassword.set(value);
  }

  toggleRole(id: number) {
    const newValue = this.isSelected(id) ? null : id;
    this.role?.setValue(newValue);
    this.role?.markAsTouched();
  }
}
