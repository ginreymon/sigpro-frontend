import { Component, signal } from '@angular/core';
import { WorkSpaceLayout } from '../../../layouts/work-space-layout/work-space-layout';
import { DataTable } from '../../../shared/components/table/data-table/data-table';
import { BaseCrudPage } from '../../../common/classes/base-crud-page';
import { Module } from '../../../models/production/module';
import { ModuleService } from '../../../services/production/module-service';
import { SideModalLayout } from '../../../shared/components/layout/side-modal-layout/side-modal-layout';
import { ModalLayout } from '../../../shared/components/layout/modal-layout/modal-layout';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { UiFormField } from '../../../shared/elements/ui-form-field/ui-form-field';
import { UiInput } from '../../../shared/elements/ui-input/ui-input';
import { UiSelect } from '../../../shared/elements/ui-select/ui-select';
import { UiCombobox } from '../../../shared/elements/ui-combobox/ui-combobox';
import { WorkCenterService } from '../../../services/production/work-center-service';
import { UiCheckbox } from '../../../shared/elements/ui-checkbox/ui-checkbox';
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
import { User } from '../../../models/user/user';
import { UserService } from '../../../services/user/user-service';
import { UiCloseButton } from '../../../shared/elements/ui-close-button/ui-close-button';
import { UiTabs, TabItem } from '../../../shared/elements/ui-tabs/ui-tabs';

const TABS: TabItem[] = [
  { key: 'general', label: 'General' },
  { key: 'accounts', label: 'Cuentas' },
];

const TAB_FIELDS: Record<string, string[]> = {
  general: ['name', 'number', 'operator_count', 'location_id', 'work_center_id', 'machine', 'is_active'],
  accounts: [],
};

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
    UiCombobox,
    UiCheckbox,
    TableTemplate,
    UiErrorMessage,
    UiBadge,
    CharSquare,
    Metadata,
    TitleCasePipe,
    UiTooltip,
    UiCloseButton,
    UiTabs,
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
  userPicker = new FormControl<number | null>(null);
  assignedUsersList = signal<{ id: number; username: string }[]>([]);

  tabs = TABS;
  activeTab = signal('general');

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
      number: [null, [Validators.required, Validators.min(1)]],
      operator_count: [null, [Validators.required, Validators.min(1)]],
      location_id: [null, [Validators.required, Validators.min(1)]],
      is_active: [null],
      work_center_id: [null, [Validators.required, Validators.min(1)]],
      machine: [null],
      assigned_user_ids: this.fb.control<number[]>([]),
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

  get isActive() {
    return this.modelForm.get('is_active');
  }

  get workCenter() {
    return this.modelForm.get('work_center_id');
  }

  get machine() {
    return this.modelForm.get('machine');
  }

  get assignedUserIds() {
    return this.modelForm.get('assigned_user_ids');
  }

  onTabChange(key: string): void {
    this.activeTab.set(key);
  }

  get tabsView(): TabItem[] {
    return this.tabs.map((tab) => ({ ...tab, hasError: this.tabHasError(tab.key) }));
  }

  private tabHasError(key: string): boolean {
    return (TAB_FIELDS[key] ?? []).some((name) => {
      const control = this.modelForm.get(name);
      return !!control && control.invalid && control.touched;
    });
  }

  get availableUsers(): User[] {
    const ids = this.assignedUsersList().map((u) => u.id);
    return this.users().filter((u) => !ids.includes(u.id));
  }

  addUser(): void {
    const userId = this.userPicker.value;
    if (userId == null) return;
    const user = this.users().find((u) => u.id === Number(userId));
    if (!user) return;

    this.assignedUsersList.update((list) => [...list, { id: user.id, username: user.username }]);
    this.assignedUserIds?.setValue(this.assignedUsersList().map((u) => u.id));
    this.userPicker.reset(null);
  }

  removeUser(id: number): void {
    this.assignedUsersList.update((list) => list.filter((u) => u.id !== id));
    this.assignedUserIds?.setValue(this.assignedUsersList().map((u) => u.id));
  }

  protected override closeModelForm(): void {
    this.activeTab.set('general');
    this.userPicker.reset(null);
    this.assignedUsersList.set([]);
    super.closeModelForm();
  }

  protected override actionHandler(event: TableActionEvent<Module>): void {
    super.actionHandler(event);
    this.userPicker.reset(null);

    if (event.type == 'edit') {
      this.modelForm.patchValue(event.obj);
      this.workCenter?.setValue(event.obj.work_center.id);
      this.locationId?.setValue(event.obj.location?.id ?? null);
      this.machine?.setValue(event.obj.machine?.id ?? null);
      this.assignedUsersList.set(event.obj.assigned_users ?? []);
      this.assignedUserIds?.setValue(event.obj.assigned_users?.map((u) => u.id) ?? []);
    } else {
      this.assignedUsersList.set([]);
    }
  }

  protected override submit(): void {
    const { machine, ...formValue } = this.modelForm.value;
    const payload: Partial<Module> = {
      ...formValue,
      is_active: this.isActive?.value ?? true,
      // If location isn't in the stamping domain, force null so the backend clears
      // any existing assignment instead of leaving it orphaned.
      machine_id: this.isStampingLocation ? (machine ? Number(machine) : null) : null,
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
