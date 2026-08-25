import { Component, signal } from '@angular/core';
import { WorkSpaceLayout } from '../../../layouts/work-space-layout/work-space-layout';
import { DataTable } from '../../../shared/components/table/data-table/data-table';
import { BaseCrudPage } from '../../../common/classes/base-crud-page';
import { Module } from '../../../models/production/module';
import { ModuleService } from '../../../services/production/module-service';
import { SideModalLayout } from '../../../shared/components/layout/side-modal-layout/side-modal-layout';
import { ModalLayout } from '../../../shared/components/layout/modal-layout/modal-layout';
import { ReactiveFormsModule, Validators } from '@angular/forms';
import { UiFormField } from '../../../shared/elements/ui-form-field/ui-form-field';
import { UiInput } from '../../../shared/elements/ui-input/ui-input';
import { UiSelect } from '../../../shared/elements/ui-select/ui-select';
import { WorkCenterService } from '../../../services/production/work-center-service';
import { WorkCenter } from '../../../models/production/work-center';
import { ProductionAreaService } from '../../../services/production/production-area-service';
import { ProductionArea } from '../../../models/production/production-area';
import { TableTemplate } from '../../../directives/table-template';
import { UiErrorMessage } from '../../../shared/elements/ui-error-message/ui-error-message';
import { UiBadge } from '../../../shared/elements/ui-badge/ui-badge';
import { TableActionEvent } from '../../../common/interfaces/table-action-event';
import { CharSquare } from "../../../shared/components/widgets/char-square/char-square";
import { Metadata } from "../../../shared/components/widgets/metadata/metadata";
import { TableColumn } from '../../../common/interfaces/table-column';
import { TitleCasePipe } from '@angular/common';
import { UiTooltip } from "../../../shared/elements/ui-tooltip/ui-tooltip";
import { StampingMachine } from '../../../models/stamping/stamping-machine';
import { StampingMachineService } from '../../../services/stamping/stamping-machine-service';
import { UiCheckbox } from '../../../shared/elements/ui-checkbox/ui-checkbox';
import { User } from '../../../models/user/user';
import { UserService } from '../../../services/user/user-service';

@Component({
  selector: 'app-modules',
  imports: [
    WorkSpaceLayout,
    DataTable,
    SideModalLayout,
    ModalLayout,
    ReactiveFormsModule,
    UiFormField,
    UiInput,
    UiSelect,
    TableTemplate,
    UiErrorMessage,
    UiBadge,
    CharSquare,
    Metadata,
    TitleCasePipe,
    UiTooltip,
    UiCheckbox,
],
  templateUrl: './modules.html',
  styleUrl: './modules.css',
})
export class Modules extends BaseCrudPage<Module> {
  protected override entityName: string = 'módulo';
  workCenters = signal<WorkCenter[]>([]);
  productionAreas = signal<ProductionArea[]>([]);
  machines = signal<StampingMachine[]>([]);
  users = signal<User[]>([]);

  constructor(
    private moduleService: ModuleService,
    private workCenterService: WorkCenterService,
    private productionAreaService: ProductionAreaService,
    private stampingMachineService: StampingMachineService,
    private userService: UserService,
  ) {
    super(moduleService);
    this.getWorkCenters();
    this.getProductionAreas();
    this.loadList(this.stampingMachineService, this.machines, true,
      items => items.sort((a, b) => a.name.localeCompare(b.name))
    );
    this.loadList(this.userService, this.users, true,
      items => items.sort((a, b) => a.username.localeCompare(b.username))
    );
  }

  protected get isStampingLocation(): boolean {
    const locationId = this.locationId?.value;
    if (!locationId) return false;
    const area = this.productionAreas().find((a) => a.id === Number(locationId));
    return area?.core_module?.url === 'stamping';
  }

  protected get isStampingModule(): boolean {
    return this.rowObject.location?.core_module?.url === 'stamping';
  }

  protected override get columns(): TableColumn<Module>[] {
    return [
      { field: 'name', label: 'Nombre' },
      { type: 'template', label: 'Ubicación', templateName: 'locationTemplate' },
      { field: 'number', label: 'Número' },
      { field: 'operator_count', label: 'Encomendados' },
      { type: 'template', label: 'Centros de trabajo', templateName: 'workCenterTemplate' },
      { type: 'template', label: 'Estado', templateName: 'statusTemplate' },
    ];
  }

  protected override initializeModelForm(): void {
    this.modelForm = this.fb.group({
      name: [null, [Validators.required, Validators.minLength(3)]],
      number: [null, [Validators.min(1)]],
      operator_count: [null, [Validators.required, Validators.min(1)]],
      location_id: [null, [Validators.required, Validators.min(1)]],
      work_center_id: [null, [Validators.required, Validators.min(1)]],
      machine: [null],
      uses_processes_search: [false],
      assigned_user_id: [null],
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

  get locationId() {
    return this.modelForm.get('location_id');
  }

  get workCenter() {
    return this.modelForm.get('work_center_id');
  }

  get machine() {
    return this.modelForm.get('machine');
  }

  get usesProcessesSearch() {
    return this.modelForm.get('uses_processes_search');
  }

  get assignedUserId() {
    return this.modelForm.get('assigned_user_id');
  }

  protected override actionHandler(event: TableActionEvent<Module>): void {
    super.actionHandler(event);

    if (event.type == 'edit') {
      this.modelForm.patchValue(event.obj);
      this.workCenter?.setValue(event.obj.work_center.id);
      this.locationId?.setValue(event.obj.location?.id ?? null);
      this.machine?.setValue(event.obj.machine?.id ?? null);
      this.usesProcessesSearch?.setValue(event.obj.machine?.uses_processes_search ?? false);
      this.assignedUserId?.setValue(event.obj.assigned_users?.[0]?.id ?? null);
    }
  }

  protected override submit(): void {
    const { machine, uses_processes_search, assigned_user_id, ...formValue } = this.modelForm.value;
    const payload: Partial<Module> = {
      ...formValue,
      // If location isn't in the stamping domain, force null so the backend clears
      // any existing assignment instead of leaving it orphaned.
      machine_id: this.isStampingLocation ? (machine ? Number(machine) : null) : null,
      uses_processes_search: this.isStampingLocation ? !!uses_processes_search : false,
      assigned_user_ids: assigned_user_id ? [Number(assigned_user_id)] : [],
    };

    super.submit(payload);
  }

  getWorkCenters() {
    this.loadList(this.workCenterService, this.workCenters, true,
      items => items.sort((a, b) => a.description.localeCompare(b.description))
    );
  }

  getProductionAreas() {
    this.loadList(this.productionAreaService, this.productionAreas, true,
      items => items.sort((a, b) => a.name.localeCompare(b.name))
    );
  }
}
