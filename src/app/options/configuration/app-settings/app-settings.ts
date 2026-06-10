import { Component } from '@angular/core';
import { ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { TitleCasePipe } from '@angular/common';
import { BaseCrudPage } from '../../../common/classes/base-crud-page';
import { AppSetting } from '../../../models/core/app-setting';
import { AppSettingService } from '../../../services/core/app-setting-service';
import { TableColumn } from '../../../common/interfaces/table-column';
import { TableActions } from '../../../common/interfaces/table-actions';
import { TableToolsButtons } from '../../../common/interfaces/table-tools-buttons';
import { TableActionEvent } from '../../../common/interfaces/table-action-event';
import { WorkSpaceLayout } from '../../../layouts/work-space-layout/work-space-layout';
import { DataTable } from '../../../shared/components/data-table/data-table';
import { SideModalLayout } from '../../../shared/components/side-modal-layout/side-modal-layout';
import { ModalLayout } from '../../../shared/components/modal-layout/modal-layout';
import { CharSquare } from '../../../shared/components/char-square/char-square';
import { Metadata } from '../../../shared/components/metadata/metadata';
import { UiFormField } from '../../../shared/elements/ui-form-field/ui-form-field';
import { UiInput } from '../../../shared/elements/ui-input/ui-input';
import { UiSelect } from '../../../shared/elements/ui-select/ui-select';
import { UiLargeInput } from '../../../shared/elements/ui-large-input/ui-large-input';
import { UiCheckbox } from '../../../shared/elements/ui-checkbox/ui-checkbox';
import { UiBadge } from '../../../shared/elements/ui-badge/ui-badge';
import { UiErrorMessage } from '../../../shared/elements/ui-error-message/ui-error-message';
import { TableTemplate } from '../../../directives/table-template';

@Component({
  selector: 'app-app-settings',
  imports: [
    WorkSpaceLayout,
    DataTable,
    SideModalLayout,
    ModalLayout,
    CharSquare,
    Metadata,
    ReactiveFormsModule,
    UiFormField,
    UiInput,
    UiSelect,
    UiLargeInput,
    UiCheckbox,
    UiBadge,
    UiErrorMessage,
    TableTemplate,  
  ],
  templateUrl: './app-settings.html',
  styleUrl: './app-settings.css',
})
export class AppSettings extends BaseCrudPage<AppSetting> {
  protected override entityName = 'configuración';

  readonly dataTypes = [
    { label: 'String', value: 'STRING' },
    { label: 'Integer', value: 'INTEGER' },
    { label: 'Decimal', value: 'DECIMAL' },
    { label: 'Boolean', value: 'BOOLEAN' },
    { label: 'JSON', value: 'JSON' },
  ];

  getDataTypeLabel(value: string): string {
    return this.dataTypes.find((d) => d.value === value)?.label ?? value;
  }

  constructor(private appSettingService: AppSettingService) {
    super(appSettingService);
  }

  protected override get columns(): TableColumn<AppSetting>[] {
    return [
      { field: 'name', label: 'Nombre' },
      { type: 'template', label: 'Valor', templateName: 'valueTemplate' },
      { type: 'template', label: 'Tipo', templateName: 'dataTypeTemplate' },
      { type: 'template', label: 'Estado', templateName: 'statusTemplate' },
    ];
  }

  protected override get actions(): TableActions {
    return {
      view: { enabled: true, title: 'Ver configuración', iconName: 'eye', toolTip: 'Ver' },
      edit: { enabled: true, title: 'Editar configuración', iconName: 'pencil', toolTip: 'Editar' },
      delete: { enabled: false, title: 'Eliminar configuración', iconName: 'trash', toolTip: 'Eliminar' },
      create: { enabled: false, title: 'Crear configuración' },
    };
  }

  protected override tableToolsButtons: TableToolsButtons = {
    filter: { enabled: false },
    columns: { enabled: false },
    export: { enabled: false },
    addItem: { enabled: false },
  };

  protected override initializeModelForm(): void {
    this.modelForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      value: ['', [Validators.required]],
      data_type: ['STRING', [Validators.required]],
      description: [null],
      is_active: [true],
    });
  }

  protected override actionHandler(event: TableActionEvent<AppSetting>): void {
    super.actionHandler(event);
    if (event.type === 'edit') {
      this.modelForm.patchValue(event.obj);
      this.name?.disable();
      this.dataType?.disable();
      this.isActive?.disable();
    }
  }

  protected override submit(): void {
    if (!this.validateModelForm()) return;
    this.loaderService.showLoader();
    const payload: Partial<AppSetting> = {
      value: this.value?.value,
      description: this.description?.value,
    };
    this.crudService
      .patch(this.rowObject.id!, payload)
      .pipe(finalize(() => this.reload(() => this.loaderService.hideLoader())))
      .subscribe({
        next: () => {
          this.closeModelForm();
          this.dialogService.openToast('Proceso exitoso', 'El registro fue actualizado correctamente.', 'check');
        },
        error: () => {
          this.errorMessage.set('Ocurrió un error. Intente nuevamente.');
        },
      });
  }

  get name() { return this.modelForm?.get('name'); }
  get value() { return this.modelForm?.get('value'); }
  get dataType() { return this.modelForm?.get('data_type'); }
  get description() { return this.modelForm?.get('description'); }
  get isActive() { return this.modelForm?.get('is_active'); }
}
