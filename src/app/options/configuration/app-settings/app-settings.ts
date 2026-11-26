import { Component } from '@angular/core';
import { AbstractControl, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { BaseCrudPage } from '../../../common/classes/base-crud-page';
import { AppSetting, AppSettingDataTypeCode } from '../../../models/core/app-setting';
import { AppSettingService } from '../../../services/core/app-setting-service';
import { TableColumn } from '../../../common/interfaces/table-column';
import { TableActions } from '../../../common/interfaces/table-actions';
import { TableToolsButtons } from '../../../common/interfaces/table-tools-buttons';
import { TableActionEvent } from '../../../common/interfaces/table-action-event';
import { WorkSpaceLayout } from '../../../layouts/work-space-layout/work-space-layout';
import { DataTable } from '../../../shared/components/table/data-table/data-table';
import { SideModalLayout } from '../../../shared/components/layout/side-modal-layout/side-modal-layout';
import { ModalLayout } from '../../../shared/components/layout/modal-layout/modal-layout';
import { CharSquare } from '../../../shared/components/widgets/char-square/char-square';
import { Metadata } from '../../../shared/components/widgets/metadata/metadata';
import { UiFormField } from '../../../shared/elements/ui-form-field/ui-form-field';
import { UiInput } from '../../../shared/elements/ui-input/ui-input';
import { UiSelect } from '../../../shared/elements/ui-select/ui-select';
import { UiTextarea } from '../../../shared/elements/ui-textarea/ui-textarea';
import { UiDecimalInput } from '../../../shared/elements/ui-decimal-input/ui-decimal-input';
import { UiCheckbox } from '../../../shared/elements/ui-checkbox/ui-checkbox';
import { UiErrorMessage } from '../../../shared/elements/ui-error-message/ui-error-message';
import { TableTemplate } from '../../../directives/table-template';
import { UiFormSection } from '../../../shared/elements/ui-form-section/ui-form-section';

/** Rejects text that is not valid JSON (empty is handled by `required`). */
function jsonValidator(control: AbstractControl): ValidationErrors | null {
  const text = control.value;
  if (typeof text !== 'string' || !text.trim()) return null;
  try {
    JSON.parse(text);
    return null;
  } catch {
    return { json: true };
  }
}

@Component({
  selector: 'app-app-settings',
  imports: [
    UiFormSection,
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
    UiTextarea,
    UiDecimalInput,
    UiCheckbox,
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

  getDataTypeLabel(value: string | undefined): string {
    return this.dataTypes.find((d) => d.value === value)?.label ?? value ?? '-';
  }

  constructor(private appSettingService: AppSettingService) {
    super(appSettingService);
  }

  protected override get columns(): TableColumn<AppSetting>[] {
    return [
      { field: 'name', label: 'Nombre' },
      { type: 'template', label: 'Valor', templateName: 'valueTemplate' },
      { type: 'template', label: 'Tipo', templateName: 'dataTypeTemplate' },
    ];
  }

  protected override get actions(): TableActions {
    return {
      view: { enabled: true, title: 'Configuración', iconName: 'eye', toolTip: 'Ver' },
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
      value_number: this.fb.control<number | null>(null),
      value_bool: this.fb.control<boolean>(false),
      data_type: ['STRING', [Validators.required]],
      description: [null],
    });
  }

  protected override actionHandler(event: TableActionEvent<AppSetting>): void {
    super.actionHandler(event);
    if (event.type === 'edit') {
      const code = event.obj.data_type_code;
      const raw = event.obj.value ?? '';
      this.modelForm.patchValue({
        ...event.obj,
        data_type: code,
        value_number: this.isNumeric(code) && raw !== '' && !isNaN(Number(raw)) ? Number(raw) : null,
        value_bool: raw.trim().toLowerCase() === 'true',
      });
      this.applyValueValidators(code);
      this.name?.disable();
      this.dataType?.disable();
    }
  }

  protected override submit(): void {
    if (!this.validateModelForm()) return;
    this.loaderService.showLoader();
    const payload: Partial<AppSetting> = {
      value: this.resolveValue(),
      description: this.description?.value,
    };
    this.crudService
      .patch(this.rowObject.id!, payload)
      .subscribe({
        next: () => {
          this.closeModelForm();
          this.dialogService.openToast('Proceso exitoso', 'El registro fue actualizado correctamente.', 'check');
          this.reload(() => this.loaderService.hideLoader());
        },
        error: () => {
          this.loaderService.hideLoader();
          this.errorMessage.set('Ocurrió un error. Intente nuevamente.');
        },
      });
  }

  isNumeric(code: string | undefined): boolean {
    return code === 'INTEGER' || code === 'DECIMAL';
  }

  /** Only the control that matches the data type is required/validated. */
  private applyValueValidators(code: AppSettingDataTypeCode): void {
    const textValidators =
      code === 'STRING' ? [Validators.required] : code === 'JSON' ? [Validators.required, jsonValidator] : [];
    this.value?.setValidators(textValidators);
    this.valueNumber?.setValidators(this.isNumeric(code) ? [Validators.required] : []);
    this.value?.updateValueAndValidity();
    this.valueNumber?.updateValueAndValidity();
  }

  /** The API stores the value as text, so each type is sent in its canonical text form. */
  private resolveValue(): string {
    switch (this.dataType?.value as AppSettingDataTypeCode) {
      case 'BOOLEAN':
        return this.valueBool?.value ? 'true' : 'false';
      case 'INTEGER':
      case 'DECIMAL':
        return String(this.valueNumber?.value);
      default:
        return this.value?.value;
    }
  }

  get name() { return this.modelForm?.get('name'); }
  get value() { return this.modelForm?.get('value'); }
  get dataType() { return this.modelForm?.get('data_type'); }
  get description() { return this.modelForm?.get('description'); }
  get valueNumber() { return this.modelForm?.get('value_number'); }
  get valueBool() { return this.modelForm?.get('value_bool'); }
}
