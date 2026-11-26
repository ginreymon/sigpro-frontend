import { Component } from '@angular/core';
import { WorkSpaceLayout } from '../../../layouts/work-space-layout/work-space-layout';
import { DataTable } from '../../../shared/components/table/data-table/data-table';
import { UiErrorMessage } from '../../../shared/elements/ui-error-message/ui-error-message';
import { Metadata } from '../../../shared/components/widgets/metadata/metadata';
import { BaseCrudPage } from '../../../common/classes/base-crud-page';
import { StampingMachineType } from '../../../models/stamping/stamping-machine-type';
import { ModalLayout } from '../../../shared/components/layout/modal-layout/modal-layout';
import { SideModalLayout } from '../../../shared/components/layout/side-modal-layout/side-modal-layout';
import { ReactiveFormsModule, Validators } from '@angular/forms';
import { StampingMachineTypeService } from '../../../services/stamping/stamping-machine-type-service';
import { UiFormField } from '../../../shared/elements/ui-form-field/ui-form-field';
import { UiInput } from '../../../shared/elements/ui-input/ui-input';
import { UiCheckbox } from '../../../shared/elements/ui-checkbox/ui-checkbox';
import { UiBadge } from '../../../shared/elements/ui-badge/ui-badge';
import { TableTemplate } from '../../../directives/table-template';
import { CharSquare } from '../../../shared/components/widgets/char-square/char-square';
import { TableActionEvent } from '../../../common/interfaces/table-action-event';
import { TableColumn } from '../../../common/interfaces/table-column';
import { TitleCasePipe } from '@angular/common';
import { UiFormSection } from '../../../shared/elements/ui-form-section/ui-form-section';

@Component({
  selector: 'app-machine-types',
  imports: [
    UiFormSection,
    WorkSpaceLayout,
    DataTable,
    UiErrorMessage,
    Metadata,
    ModalLayout,
    SideModalLayout,
    ReactiveFormsModule,
    UiFormField,
    UiInput,
    UiCheckbox,
    UiBadge,
    TableTemplate,
    CharSquare,
    TitleCasePipe,
  ],
  templateUrl: './machine-types.html',
  styleUrl: './machine-types.css',
})
export class MachineTypes extends BaseCrudPage<StampingMachineType> {
  protected override entityName: string = 'tipo de máquina';

  constructor(private stampingMachineTypeService: StampingMachineTypeService) {
    super(stampingMachineTypeService);
  }

  protected override get columns(): TableColumn<StampingMachineType>[] {
    return [
      { field: 'name', label: 'Nombre' },
      { type: 'template', label: 'Estado', templateName: 'statusTemplate' },
    ];
  }

  protected override initializeModelForm(): void {
    this.modelForm = this.fb.group({
      name: [null, [Validators.required, Validators.minLength(3)]],
      is_active: [null, this.actionType === 'edit' ? [Validators.required] : []],
    });
  }

  get name() {
    return this.modelForm.get('name');
  }

  get isActive() {
    return this.modelForm.get('is_active');
  }

  protected override actionHandler(event: TableActionEvent<StampingMachineType>): void {
    super.actionHandler(event);
    if (event.type == 'edit') {
      this.modelForm.patchValue(event.obj);
    }
  }

  protected override submit(): void {
    const machineType: Partial<StampingMachineType> = {
      ...this.modelForm.value,
      is_active: this.isActive?.value ?? true,
    };
    super.submit(machineType);
  }
}
