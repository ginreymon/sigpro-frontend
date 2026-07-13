import { Component, signal } from '@angular/core';
import { WorkSpaceLayout } from '../../../layouts/work-space-layout/work-space-layout';
import { DataTable } from '../../../shared/components/table/data-table/data-table';
import { UiErrorMessage } from '../../../shared/elements/ui-error-message/ui-error-message';
import { Metadata } from '../../../shared/components/widgets/metadata/metadata';
import { BaseCrudPage } from '../../../common/classes/base-crud-page';
import { StampingMachine } from '../../../models/stamping/stamping-machine';
import { StampingMachineType } from '../../../models/stamping/stamping-machine-type';
import { ModalLayout } from '../../../shared/components/layout/modal-layout/modal-layout';
import { SideModalLayout } from '../../../shared/components/layout/side-modal-layout/side-modal-layout';
import { ReactiveFormsModule, Validators } from '@angular/forms';
import { StampingMachineService } from '../../../services/stamping/stamping-machine-service';
import { StampingMachineTypeService } from '../../../services/stamping/stamping-machine-type-service';
import { UiFormField } from '../../../shared/elements/ui-form-field/ui-form-field';
import { UiInput } from '../../../shared/elements/ui-input/ui-input';
import { UiSelect } from '../../../shared/elements/ui-select/ui-select';
import { UiCheckbox } from '../../../shared/elements/ui-checkbox/ui-checkbox';
import { UiBadge } from '../../../shared/elements/ui-badge/ui-badge';
import { TableTemplate } from '../../../directives/table-template';
import { CharSquare } from '../../../shared/components/widgets/char-square/char-square';
import { TableActionEvent } from '../../../common/interfaces/table-action-event';
import { TableColumn } from '../../../common/interfaces/table-column';
import { TitleCasePipe } from '@angular/common';

@Component({
  selector: 'app-machines',
  imports: [
    WorkSpaceLayout,
    DataTable,
    UiErrorMessage,
    Metadata,
    ModalLayout,
    SideModalLayout,
    ReactiveFormsModule,
    UiFormField,
    UiInput,
    UiSelect,
    UiCheckbox,
    UiBadge,
    TableTemplate,
    CharSquare,
    TitleCasePipe,
  ],
  templateUrl: './machines.html',
  styleUrl: './machines.css',
})
export class Machines extends BaseCrudPage<StampingMachine> {
  protected override entityName: string = 'máquina de estampación';

  machineTypes = signal<StampingMachineType[]>([]);

  constructor(
    private stampingMachineService: StampingMachineService,
    private stampingMachineTypeService: StampingMachineTypeService,
  ) {
    super(stampingMachineService);
  }

  ngOnInit(): void {
    this.loadList(this.stampingMachineTypeService, this.machineTypes);
  }

  protected override get columns(): TableColumn<StampingMachine>[] {
    return [
      { field: 'name', label: 'Nombre' },
      { field: 'machine_type_name', label: 'Tipo' },
      { type: 'template', label: 'Estado', templateName: 'statusTemplate' },
    ];
  }

  protected override initializeModelForm(): void {
    this.modelForm = this.fb.group({
      name: [null, [Validators.required, Validators.minLength(3)]],
      machine_type: [null, [Validators.required]],
      is_active: [null, this.actionType === 'edit' ? [Validators.required] : []],
    });
  }

  get name() {
    return this.modelForm.get('name');
  }

  get machineType() {
    return this.modelForm.get('machine_type');
  }

  get isActive() {
    return this.modelForm.get('is_active');
  }

  protected override actionHandler(event: TableActionEvent<StampingMachine>): void {
    super.actionHandler(event);
    if (event.type == 'edit') {
      this.modelForm.patchValue(event.obj);
    }
  }

  protected override submit(): void {
    const machine: Partial<StampingMachine> = {
      ...this.modelForm.value,
      is_active: this.isActive?.value ?? true,
    };
    super.submit(machine);
  }
}
