import { Component, signal } from '@angular/core';
import { BaseCrudPage } from '../../../common/classes/base-crud-page';
import { EmployeeContinuousWorkLimit } from '../../../models/production/employee-continuous-work-limit';
import { EmployeeContinuousWorkLimitService } from '../../../services/production/employee-continuous-work-limit-service';
import { Employee } from '../../../models/production/employee';
import { EmployeeDirectoryService } from '../../../services/user/employee-directory-service';
import { WorkSpaceLayout } from '../../../layouts/work-space-layout/work-space-layout';
import { DataTable } from '../../../shared/components/table/data-table/data-table';
import { SideModalLayout } from '../../../shared/components/layout/side-modal-layout/side-modal-layout';
import { ModalLayout } from '../../../shared/components/layout/modal-layout/modal-layout';
import { ReactiveFormsModule, Validators } from '@angular/forms';
import { UiErrorMessage } from '../../../shared/elements/ui-error-message/ui-error-message';
import { UiFormField } from '../../../shared/elements/ui-form-field/ui-form-field';
import { UiInput } from '../../../shared/elements/ui-input/ui-input';
import { UiSelect } from '../../../shared/elements/ui-select/ui-select';
import { UiTextarea } from '../../../shared/elements/ui-textarea/ui-textarea';
import { UiCheckbox } from '../../../shared/elements/ui-checkbox/ui-checkbox';
import { UiBadge } from '../../../shared/elements/ui-badge/ui-badge';
import { TableTemplate } from '../../../directives/table-template';
import { CharSquare } from '../../../shared/components/widgets/char-square/char-square';
import { Metadata } from '../../../shared/components/widgets/metadata/metadata';
import { TableActionEvent } from '../../../common/interfaces/table-action-event';
import { TableColumn } from '../../../common/interfaces/table-column';
import { PaginatedResponse } from '../../../common/interfaces/paginated-response';
import { UiInfoPanel } from "../../../shared/elements/ui-info-panel/ui-info-panel";

@Component({
  selector: 'app-restricted-work-time',
  imports: [
    WorkSpaceLayout,
    DataTable,
    SideModalLayout,
    ModalLayout,
    ReactiveFormsModule,
    UiErrorMessage,
    UiFormField,
    UiInput,
    UiSelect,
    UiTextarea,
    UiCheckbox,
    UiBadge,
    TableTemplate,
    CharSquare,
    Metadata,
    UiInfoPanel
],
  templateUrl: './restricted-work-time.html',
  styleUrl: './restricted-work-time.css',
})
export class RestrictedWorkTime extends BaseCrudPage<EmployeeContinuousWorkLimit> {
  protected override entityName: string = 'Restricción';
  employees = signal<Employee[]>([]);

  protected readonly continuousWorkMinutesInfo =
    'Minutos máximos de trabajo continuo dentro de una hora. Valor permitido: 0 a 60 minutos.';

  constructor(
    private employeeContinuousWorkLimitService: EmployeeContinuousWorkLimitService,
    private employeeDirectoryService: EmployeeDirectoryService,
  ) {
    super(employeeContinuousWorkLimitService);
    this.getEmployees();
  }

  protected override get columns(): TableColumn<EmployeeContinuousWorkLimit>[] {
    return [
      { type: 'template', label: 'Empleado', templateName: 'employeeTemplate' },
      { type: 'template', label: 'Cédula', templateName: 'idNumberTemplate' },
      { field: 'continuous_work_minutes', label: 'Minutos continuos' },
      { field: 'description', label: 'Descripción' },
      { type: 'template', label: 'Estado', templateName: 'statusTemplate' },
    ];
  }

  protected override initializeModelForm(): void {
    this.modelForm = this.fb.group({
      employee_id: [null, Validators.required],
      continuous_work_minutes: [null, [Validators.required, Validators.min(1), Validators.max(60)]],
      description: [null],
      is_active: [true],
    });
  }

  get employeeId() {
    return this.modelForm.get('employee_id');
  }

  get continuousWorkMinutes() {
    return this.modelForm.get('continuous_work_minutes');
  }

  get description() {
    return this.modelForm.get('description');
  }

  get isActive() {
    return this.modelForm.get('is_active');
  }

  getEmployees() {
    this.loadList(this.employeeDirectoryService, this.employees, true,
      items => items
        .map(e => ({ ...e, full_name: `${e.first_name} ${e.last_name1} - ${e.id_number}` }))
        .sort((a, b) => a.full_name!.localeCompare(b.full_name!))
    );
  }

  protected override mapResponse(res: PaginatedResponse<EmployeeContinuousWorkLimit>) {
    return {
      ...res,
      results: res.results.map((limit) => {
        limit.name = `${limit.employee?.first_name ?? ''} ${limit.employee?.last_name1 ?? ''}`.trim();
        return limit;
      }),
    };
  }

  protected override actionHandler(event: TableActionEvent<EmployeeContinuousWorkLimit>): void {
    super.actionHandler(event);
    if (event.type == 'edit') {
      this.modelForm.patchValue(event.obj);
      this.employeeId?.setValue(event.obj.employee?.id ?? null);
    }
  }
}
