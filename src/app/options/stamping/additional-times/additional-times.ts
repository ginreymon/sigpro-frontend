import { Component, signal } from '@angular/core';
import { WorkSpaceLayout } from '../../../layouts/work-space-layout/work-space-layout';
import { DataTable } from '../../../shared/components/table/data-table/data-table';
import { UiErrorMessage } from '../../../shared/elements/ui-error-message/ui-error-message';
import { Metadata } from '../../../shared/components/widgets/metadata/metadata';
import { BaseCrudPage } from '../../../common/classes/base-crud-page';
import { AdditionalStampingTime } from '../../../models/stamping/additional-stamping-time';
import { ModalLayout } from '../../../shared/components/layout/modal-layout/modal-layout';
import { SideModalLayout } from '../../../shared/components/layout/side-modal-layout/side-modal-layout';
import { ReactiveFormsModule, Validators } from '@angular/forms';
import { AdditionalStampingTimeService } from '../../../services/stamping/additional-stamping-time-service';
import { UiFormField } from '../../../shared/elements/ui-form-field/ui-form-field';
import { UiInput } from '../../../shared/elements/ui-input/ui-input';
import { UiCheckbox } from '../../../shared/elements/ui-checkbox/ui-checkbox';
import { UiBadge } from '../../../shared/elements/ui-badge/ui-badge';
import { TableTemplate } from '../../../directives/table-template';
import { CharSquare } from '../../../shared/components/widgets/char-square/char-square';
import { TableActionEvent } from '../../../common/interfaces/table-action-event';
import { TableColumn } from '../../../common/interfaces/table-column';
import { UiSelect } from '../../../shared/elements/ui-select/ui-select';
import { StampingMachine } from '../../../models/stamping/stamping-machine';
import { StampingMachineService } from '../../../services/stamping/stamping-machine-service';
import { StampingMachineType } from '../../../models/stamping/stamping-machine-type';
import { StampingMachineTypeService } from '../../../services/stamping/stamping-machine-type-service';
import { UiStringListInput } from '../../../shared/elements/ui-string-list-input/ui-string-list-input';

@Component({
  selector: 'app-additional-times',
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
    UiSelect,
    UiStringListInput,
  ],
  templateUrl: './additional-times.html',
  styleUrl: './additional-times.css',
})
export class AdditionalTimes extends BaseCrudPage<AdditionalStampingTime> {
  protected override entityName: string = 'tiempo adicional';

  machines = signal<StampingMachine[]>([]);
  machineTypes = signal<StampingMachineType[]>([]);

  constructor(
    private additionalStampingTimeService: AdditionalStampingTimeService,
    private stampingMachineService: StampingMachineService,
    private stampingMachineTypeService: StampingMachineTypeService,
  ) {
    super(additionalStampingTimeService);
  }

  ngOnInit(): void {
    this.loadList(this.stampingMachineService, this.machines);
    this.loadList(this.stampingMachineTypeService, this.machineTypes);
  }

  protected override get columns(): TableColumn<AdditionalStampingTime>[] {
    return [
      { field: 'engineering_code', label: 'Código ingeniería' },
      { field: 'code_number', label: 'Código' },
      { field: 'machine_name', label: 'Máquina' },
      { field: 'machine_type_name', label: 'Tipo de Máquina' },
      { field: 'process', label: 'Proceso' },
      { type: 'template', label: 'Tiempo estándar', templateName: 'standardTimeTemplate' },
      { type: 'template', label: 'Estado', templateName: 'statusTemplate' },
    ];
  }

  protected override initializeModelForm(): void {
    this.modelForm = this.fb.group({
      code_number: [null, [Validators.required]],
      engineering_code: [null, [Validators.required]],
      machine: [null],
      machine_type: [null, [Validators.required]],
      process: [null, [Validators.required]],
      process_description: [[]],
      standard_time: [null],
      is_active: [null, this.actionType === 'edit' ? [Validators.required] : []],
    });
  }

  get codeNumber() { return this.modelForm.get('code_number'); }
  get engineeringCode() { return this.modelForm.get('engineering_code'); }
  get machine() { return this.modelForm.get('machine'); }
  get machineType() { return this.modelForm.get('machine_type'); }
  get process() { return this.modelForm.get('process'); }
  get processDescription() { return this.modelForm.get('process_description'); }
  get standardTime() { return this.modelForm.get('standard_time'); }
  get isActive() { return this.modelForm.get('is_active'); }

  protected override actionHandler(event: TableActionEvent<AdditionalStampingTime>): void {
    super.actionHandler(event);
    if (event.type == 'edit') {
      this.modelForm.patchValue({
        ...event.obj,
        process_description: event.obj.process_description ?? [],
      });
    }
  }

  protected override submit(): void {
    const additionalStampingTime: Partial<AdditionalStampingTime> = {
      ...this.modelForm.value,
      process_description: (this.modelForm.value.process_description ?? []).filter(
        (step: string) => step.trim().length > 0,
      ),
      is_active: this.isActive?.value ?? true,
    };
    super.submit(additionalStampingTime);
  }
}
