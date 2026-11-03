import { Component, signal } from '@angular/core';
import { ReactiveFormsModule, Validators } from '@angular/forms';
import { BaseCrudPage } from '../../../common/classes/base-crud-page';
import { ModuleAssignee } from '../../../models/production/module-assignee';
import { Employee } from '../../../models/production/employee';
import { Module } from '../../../models/production/module';
import { ModuleAssigneeService } from '../../../services/production/module-assignee-service';
import { ModuleService } from '../../../services/production/module-service';
import { EmployeeDirectoryService } from '../../../services/user/employee-directory-service';
import { WorkSpaceLayout } from '../../../layouts/work-space-layout/work-space-layout';
import { DataTable } from '../../../shared/components/table/data-table/data-table';
import { SideModalLayout } from '../../../shared/components/layout/side-modal-layout/side-modal-layout';
import { ModalLayout } from '../../../shared/components/layout/modal-layout/modal-layout';
import { UiErrorMessage } from '../../../shared/elements/ui-error-message/ui-error-message';
import { UiFormField } from '../../../shared/elements/ui-form-field/ui-form-field';
import { UiSelect } from '../../../shared/elements/ui-select/ui-select';
import { CharSquare } from '../../../shared/components/widgets/char-square/char-square';
import { Metadata } from '../../../shared/components/widgets/metadata/metadata';
import { TableActionEvent } from '../../../common/interfaces/table-action-event';
import { TableColumn } from '../../../common/interfaces/table-column';

@Component({
  selector: 'app-module-assignees',
  imports: [
    WorkSpaceLayout,
    DataTable,
    SideModalLayout,
    ModalLayout,
    ReactiveFormsModule,
    UiErrorMessage,
    UiFormField,
    UiSelect,
    CharSquare,
    Metadata,
  ],
  templateUrl: './module-assignees.html',
  styleUrl: './module-assignees.css',
})
export class ModuleAssignees extends BaseCrudPage<ModuleAssignee> {
  protected override entityName: string = 'asignación';
  employees = signal<Employee[]>([]);
  modules = signal<Module[]>([]);

  constructor(
    moduleAssigneeService: ModuleAssigneeService,
    private employeeDirectoryService: EmployeeDirectoryService,
    private moduleService: ModuleService,
  ) {
    super(moduleAssigneeService);
    this.loadList(this.employeeDirectoryService, this.employees, true, (items) =>
      items
        .map((e) => ({ ...e, full_name: `${e.first_name} ${e.last_name1} - ${e.id_number}` }))
        .sort((a, b) => a.full_name!.localeCompare(b.full_name!)),
    );
    this.loadList(this.moduleService, this.modules, true);
  }

  protected override get columns(): TableColumn<ModuleAssignee>[] {
    return [
      { field: 'employee_full_name', label: 'Empleado' },
      { field: 'employee_id_number', label: 'Cédula' },
      { field: 'module_name', label: 'Módulo' },
      { field: 'created_at', label: 'Fecha de creación', type: 'date' },
    ];
  }

  protected override initializeModelForm(): void {
    this.modelForm = this.fb.group({
      employee: [null, Validators.required],
      module: [null, Validators.required],
    });
  }

  get employee() {
    return this.modelForm.get('employee');
  }

  get module() {
    return this.modelForm.get('module');
  }

  protected override actionHandler(event: TableActionEvent<ModuleAssignee>): void {
    super.actionHandler(event);
    if (event.type == 'edit') {
      this.modelForm.patchValue({ employee: event.obj.employee, module: event.obj.module });
    }
  }
}
