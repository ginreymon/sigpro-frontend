import { Component, signal } from '@angular/core';
import { WorkSpaceLayout } from '../../../layouts/work-space-layout/work-space-layout';
import { DataTable } from '../../../shared/components/data-table/data-table';
import { BaseCrudPage } from '../../../common/classes/base-crud-page';
import { Module } from '../../../models/production/module';
import { ModuleService } from '../../../services/production/module-service';
import { SideModalLayout } from '../../../shared/components/side-modal-layout/side-modal-layout';
import { ModalLayout } from '../../../shared/components/modal-layout/modal-layout';
import { Loader } from '../../../shared/elements/loader/loader';
import { ReactiveFormsModule, Validators } from '@angular/forms';
import { UiFormField } from '../../../shared/elements/ui-form-field/ui-form-field';
import { UiInput } from '../../../shared/elements/ui-input/ui-input';
import { UiSelect } from '../../../shared/elements/ui-select/ui-select';
import { WorkCenterService } from '../../../services/production/work-center-service';
import { UiCheckbox } from '../../../shared/elements/ui-checkbox/ui-checkbox';
import { WorkCenter } from '../../../models/production/work-center';
import { TableTemplate } from '../../../directives/table-template';
import { UiErrorMessage } from '../../../shared/elements/ui-error-message/ui-error-message';
import { UiBadge } from '../../../shared/elements/ui-badge/ui-badge';
import { TableActionEvent } from '../../../common/interfaces/table-action-event';
import { CharSquare } from "../../../shared/components/char-square/char-square";
import { Metadata } from "../../../shared/components/metadata/metadata";
import { TableColumn } from '../../../common/interfaces/table-column';

@Component({
  selector: 'app-modules',
  imports: [
    WorkSpaceLayout,
    DataTable,   
    SideModalLayout,
    ModalLayout,
    Loader,
    ReactiveFormsModule,
    UiFormField,
    UiInput,
    UiSelect,
    UiCheckbox,
    TableTemplate,
    UiErrorMessage,
    UiBadge,
    CharSquare,
    Metadata,
  ],
  templateUrl: './modules.html',
  styleUrl: './modules.css',
})
export class Modules extends BaseCrudPage<Module> {
  workCenters = signal<WorkCenter[]>([]);

  constructor(
    private moduleService: ModuleService,
    private workCenterService: WorkCenterService,
  ) {
    super(moduleService);
    this.actions.edit = { enabled: true, title: 'Editar módulo' };
    this.actions.view = { enabled: true, title: 'Ver módulo' };
    this.actions.delete = { enabled: true, title: 'Eliminar módulo' };
    this.actions.create = { enabled: true, title: 'Crear módulo' };
    this.tableToolsButtons.addItem.enabled = true;
    this.getWorkCenters();
  }

  protected override get columns(): TableColumn<Module>[] {
    return [
      { field: 'name', label: 'Nombre' },
      { field: 'number', label: 'Número' },
      { field: 'location', label: 'Ubicación' },
      { field: 'operator_count', label: 'Encomendados' },
      { type: 'template', label: 'Centros de trabajo', templateName: 'workCenterTemplate' },
      { type: 'template', label: 'Estado', templateName: 'statusTemplate' },
    ];
  }

  protected override initializeModelForm(): void {
    this.modelForm = this.fb.group({
      name: [null, [Validators.required, Validators.minLength(4)]],
      number: [null, [Validators.required, Validators.min(1)]],
      operator_count: [null, [Validators.required, Validators.min(1)]],
      location: [null, [Validators.required, Validators.minLength(4)]],
      is_active: [null, this.actionType === 'edit' ? [Validators.required] : []],
      work_center_id: [null, [Validators.required, Validators.min(1)]],
    });
  }

  get name() {
    return this.modelForm.get('name');
  }

  get number() {
    return this.modelForm.get('number');
  }

  get operatorCount() {
    return this.modelForm.get('operator_count');
  }

  get location() {
    return this.modelForm.get('location');
  }

  get isActive() {
    return this.modelForm.get('is_active');
  }

  get workCenter() {
    return this.modelForm.get('work_center_id');
  }

  protected override actionHandler(event: TableActionEvent<Module>): void {
    super.actionHandler(event);
    if (event.type == 'edit') {
      this.modelForm.patchValue(event.obj);
      this.workCenter?.setValue(event.obj.work_center.id);
    }
  }

  protected override submit(): void {
    const workcenter: Partial<Module> = {
      ...this.modelForm.value,
      is_active: this.isActive?.value ?? true,
    };
    super.submit(workcenter);
  }

  getWorkCenters() {
    this.loadList(this.workCenterService, this.workCenters, true,
      items => items.sort((a, b) => a.description.localeCompare(b.description))
    );
  }
}
