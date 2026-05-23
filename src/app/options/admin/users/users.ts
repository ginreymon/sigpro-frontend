import { Component, signal } from '@angular/core';
import { WorkSpaceLayout } from '../../../layouts/work-space-layout/work-space-layout';
import { DataTable } from '../../../shared/components/data-table/data-table';
import { EmployeeService } from '../../../services/production/employee-service';
import { Employee } from '../../../models/production/employee';
import { SideModalLayout } from '../../../shared/components/side-modal-layout/side-modal-layout';
import { ModalLayout } from '../../../shared/components/modal-layout/modal-layout';
import { TableTemplate } from '../../../directives/table-template';
import { UiLabelButton } from '../../../shared/elements/ui-label-button/ui-label-button';
import { BaseCrudPage } from '../../../common/classes/base-crud-page';
import { RoleService } from '../../../services/user/role-service';
import { Role } from '../../../models/user/role';
import { finalize } from 'rxjs';
import { UiFormField } from '../../../shared/elements/ui-form-field/ui-form-field';
import { UiOptionCard } from '../../../shared/elements/ui-option-card/ui-option-card';
import { ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../services/auth/auth-service';
import { UiInput } from '../../../shared/elements/ui-input/ui-input';
import { UiErrorMessage } from '../../../shared/elements/ui-error-message/ui-error-message';
import { TogglePasswordBtn } from '../../../shared/elements/toggle-password-btn/toggle-password-btn';
import { ValidationIcon } from '../../../shared/elements/validation-icon/validation-icon';
import { RegisterRequest } from '../../../models/auth/register-request';
import { UserService } from '../../../services/user/user-service';
import { User } from '../../../models/user/user';
import { UiBadge } from "../../../shared/elements/ui-badge/ui-badge";
import { TableActionEvent } from '../../../common/interfaces/table-action-event';
import { CharSquare } from "../../../shared/components/char-square/char-square";
import { Metadata } from "../../../shared/components/metadata/metadata";
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
    TogglePasswordBtn,
    ValidationIcon,   
    UiBadge,
    CharSquare,
    Metadata,
    TitleCasePipe
],
  templateUrl: './users.html',
  styleUrl: './users.css',
})
export class Users extends BaseCrudPage<Employee> {
  protected override entityName: string = 'Usuario';  
  roles = signal<Role[]>([]);
  showPassword = signal<boolean>(false);

  constructor(
    private employeeService: EmployeeService,
    private roleService: RoleService,
    private authService: AuthService,
    private userService: UserService,
  ) {
    super(employeeService);  
    this.loadList(this.roleService, this.roles, false);
  }

  protected override get actions() {
    return {
      ...super.actions,
      delete: { enabled: false },
    }
  }

  protected override get columns(): TableColumn<Employee>[] {
    return [
      { field: 'first_name', label: 'Nombre' },
      { field: 'last_name1', label: 'Apellido' },
      { field: 'id_number', label: 'Cédula' },
      { field: 'cost_center_description', label: 'Centro de costos' },
      { type: 'template', label: 'Usuario', templateName: 'userNameTemplate' },
      { type: 'template', label: 'Estado', templateName: 'userStatusTemplate' },
      { type: 'template', label: 'Acciones', templateName: 'createUserTemplate', align: 'center' },
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
      password: [null, passwordValidators],
      confirmPassword: [null, passwordValidators],
      role: [null, Validators.required],
    });
  }

  get username() {
    return this.modelForm.get('username');
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

  protected override actionHandler(event: TableActionEvent<Employee>): void {
    if (event.type == 'edit' && !event.obj.has_account) {
      this.dialogService.openToast('Aviso', 'El usuario no tienen cuenta.', 'triangleExclamation');
      return;
    }

    super.actionHandler(event);

    if (event.type == 'create') {
      this.initializeModelForm();
    }

    if (event.type == 'edit') {
      this.modelForm.patchValue(event.obj);
      this.role?.setValue(event.obj.groups[0]?.id ?? null);
    }
  }

  protected override submit(): void {
    if (!this.validateModelForm()) return;

    if (this.actionType === 'create' && !this.passwordsMatch) {
      this.confirmPassword?.markAsTouched();
      return;
    }

    this.loaderService.showLoader();

    const group_id = this.role?.value;

    const register: RegisterRequest = {
      ...this.modelForm.value,
      employee_local_id: this.rowObject.id,
      group_id,
    };

    const user: Partial<User> = {
      username: this.username?.value,
      id: this.rowObject.user_id ?? undefined,
      group_id,
    };

    const request$ =
      this.actionType == 'create'
        ? this.authService.registerRequest(register)
        : this.userService.update(this.rowObject.user_id!, user);

    request$.pipe(finalize(() => this.reload(() => this.loaderService.hideLoader()))).subscribe({
      next: () => {
        this.closeModelForm();
        const actionText = this.actionType === 'create' ? 'creada' : 'actualizada';
        this.dialogService.openToast('Éxito', `La cuenta fue ${actionText} correctamente.`, 'check');
      },
      error: (err) => {
        this.errorMessage.set('Ocurrió un error. Intente nuevamente.');
      },
    });
  }

  createAccount(obj: Employee) {
    this.rowObject = obj;
    this.actionType = 'create';
    this.initializeModelForm();
    this.dialogService.openModal(`Crear cuenta - ${obj.first_name} ${obj.last_name1}`,'Crear cuenta');
  }

  activateAccount(obj: Employee) {
    const label = obj.is_account_active ? 'Desactivar' : 'Activar';
    const title = `${label} cuenta`;
    this.dialogService.openConfirm(title, '¿Está seguro de realizar esta acción?', label, () => {
      this.loaderService.showLoader();
      const user: Partial<User> = { is_active: !obj.is_account_active };
      this.userService
        .update(obj.user_id!, user)
        .pipe(finalize(() => this.reload(() => this.loaderService.hideLoader())))
        .subscribe({
          next: () => {
            this.dialogService.closeConfirm();
            const actionText = obj.is_account_active ? 'desactivada' : 'activada';
            this.dialogService.openToast('Éxito', `La cuenta "${obj.username}" fue ${actionText} correctamente.`, 'check');
          },
          error: () => this.dialogService.closeConfirm(),
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
