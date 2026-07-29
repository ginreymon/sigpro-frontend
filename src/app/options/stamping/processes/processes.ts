import { Component, signal } from '@angular/core';
import { WorkSpaceLayout } from '../../../layouts/work-space-layout/work-space-layout';
import { DataTable } from '../../../shared/components/table/data-table/data-table';
import { UiErrorMessage } from '../../../shared/elements/ui-error-message/ui-error-message';
import { Metadata } from '../../../shared/components/widgets/metadata/metadata';
import { BaseCrudPage } from '../../../common/classes/base-crud-page';
import { StampingProcess } from '../../../models/stamping/stamping-process';
import { ModalLayout } from '../../../shared/components/layout/modal-layout/modal-layout';
import { SideModalLayout } from '../../../shared/components/layout/side-modal-layout/side-modal-layout';
import { ReactiveFormsModule, Validators } from '@angular/forms';
import { StampingProcessService } from '../../../services/stamping/stamping-process-service';
import { UiFormField } from '../../../shared/elements/ui-form-field/ui-form-field';
import { UiInput } from '../../../shared/elements/ui-input/ui-input';
import { UiCheckbox } from '../../../shared/elements/ui-checkbox/ui-checkbox';
import { UiBadge } from '../../../shared/elements/ui-badge/ui-badge';
import { TableTemplate } from '../../../directives/table-template';
import { CharSquare } from '../../../shared/components/widgets/char-square/char-square';
import { TableColumn } from '../../../common/interfaces/table-column';
import { TitleCasePipe } from '@angular/common';
import { TableActionEvent } from '../../../common/interfaces/table-action-event';
import { UiSelect } from '../../../shared/elements/ui-select/ui-select';
import { StampingMachine } from '../../../models/stamping/stamping-machine';
import { StampingMachineService } from '../../../services/stamping/stamping-machine-service';

@Component({
  selector: 'app-processes',
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
    UiCheckbox,
    UiBadge,
    TableTemplate,
    CharSquare,
    TitleCasePipe,
    UiSelect,
  ],
  templateUrl: './processes.html',
  styleUrl: './processes.css',
})
export class Processes extends BaseCrudPage<StampingProcess> {
  protected override entityName: string = 'proceso';

  machines = signal<StampingMachine[]>([]);

  constructor(
    private stampingProcessService: StampingProcessService,
    private stampingMachineService: StampingMachineService,
  ) {
    super(stampingProcessService);
  }

  ngOnInit(): void {
    this.loadList(this.stampingMachineService, this.machines);
  }

  protected override get columns(): TableColumn<StampingProcess>[] {
    return [
      { field: 'name', label: 'Nombre' },
      { field: 'machine_name', label: 'Máquina' },
      { type: 'template', label: 'Estado', templateName: 'statusTemplate' },
    ];
  }

  protected override initializeModelForm(): void {
    this.modelForm = this.fb.group({
      name: [null, [Validators.required, Validators.minLength(3)]],
      machine: [null],
      is_active: [null, this.actionType === 'edit' ? [Validators.required] : []],
    });
  }

  get name() {
    return this.modelForm.get('name');
  }

  get machine() {
    return this.modelForm.get('machine');
  }

  get isActive() {
    return this.modelForm.get('is_active');
  }

  protected override actionHandler(event: TableActionEvent<StampingProcess>): void {
    super.actionHandler(event);
    if (event.type == 'edit') {
      this.modelForm.patchValue(event.obj);
    }
  }

  protected override submit(): void {
    const process: Partial<StampingProcess> = {
      ...this.modelForm.value,
      is_active: this.isActive?.value ?? true,
    };
    super.submit(process);
  }
}
