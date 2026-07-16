import { Component, signal } from '@angular/core';
import { WorkSpaceLayout } from '../../../layouts/work-space-layout/work-space-layout';
import { DataTable } from '../../../shared/components/table/data-table/data-table';
import { UiErrorMessage } from '../../../shared/elements/ui-error-message/ui-error-message';
import { Metadata } from '../../../shared/components/widgets/metadata/metadata';
import { BaseCrudPage } from '../../../common/classes/base-crud-page';
import { StampingReferenceSam } from '../../../models/stamping/stamping-reference-sam';
import { ModalLayout } from '../../../shared/components/layout/modal-layout/modal-layout';
import { SideModalLayout } from '../../../shared/components/layout/side-modal-layout/side-modal-layout';
import { ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize, Subscription } from 'rxjs';
import { StampingReferenceSamService } from '../../../services/stamping/stamping-reference-sam-service';
import { UiFormField } from '../../../shared/elements/ui-form-field/ui-form-field';
import { UiInput } from '../../../shared/elements/ui-input/ui-input';
import { UiSelect } from '../../../shared/elements/ui-select/ui-select';
import { UiCombobox } from '../../../shared/elements/ui-combobox/ui-combobox';
import { UiCheckbox } from '../../../shared/elements/ui-checkbox/ui-checkbox';
import { TableTemplate } from '../../../directives/table-template';
import { CharSquare } from '../../../shared/components/widgets/char-square/char-square';
import { TableColumn } from '../../../common/interfaces/table-column';
import { UiTabs, TabItem } from '../../../shared/elements/ui-tabs/ui-tabs';
import { SamTargetCalculator } from '../../../shared/components/production/widgets/sam-target-calculator/sam-target-calculator';
import { SamTargetCalculatorPanel } from '../../../shared/components/production/widgets/sam-target-calculator/sam-target-calculator-panel';
import { SamCalculatorStateService } from '../../../shared/components/production/widgets/sam-target-calculator/sam-calculator-state';
import { calcSamTarget } from '../../../shared/components/production/widgets/sam-target-calculator/sam-target-formula';
import { TableActionEvent } from '../../../common/interfaces/table-action-event';
import { Reference } from '../../../models/catalog/reference';
import { ReferencesService } from '../../../services/catalog/references-service';
import { StampingMachine } from '../../../models/stamping/stamping-machine';
import { StampingMachineService } from '../../../services/stamping/stamping-machine-service';
import { StampingPiece } from '../../../models/stamping/stamping-piece';
import { StampingPieceService } from '../../../services/stamping/stamping-piece-service';
import { StampingLocation } from '../../../models/stamping/stamping-location';
import { StampingLocationService } from '../../../services/stamping/stamping-location-service';
import { StampingStampTypeDescription } from '../../../models/stamping/stamping-stamp-type-description';
import { StampingStampTypeDescriptionService } from '../../../services/stamping/stamping-stamp-type-description-service';
import { StampingFabricType } from '../../../models/stamping/stamping-fabric-type';
import { StampingFabricTypeService } from '../../../services/stamping/stamping-fabric-type-service';
import { StampingTechnique } from '../../../models/stamping/stamping-technique';
import { StampingTechniqueService } from '../../../services/stamping/stamping-technique-service';

const TABS: TabItem[] = [
  { key: 'identification', label: 'Identificación' },
  { key: 'production', label: 'Producción' },
  { key: 'sam', label: 'SAM' },
  { key: 'classification', label: 'Clasificación' },
  { key: 'process', label: 'Proceso' },
];

const TAB_FIELDS: Record<string, string[]> = {
  identification: ['no_reference', 'rowid_item', 'identification'],
  production: ['location', 'machine', 'piece', 'people_count', 'stamped_pieces', 'pieces_per_board'],
  classification: ['fabric_type', 'brand', 'line', 'collection', 'garment_type'],
  process: ['stamp_type_description', 'technique', 'process', 'frames', 'inks', 'prints', 'layout_form', 'pre_dried'],
  sam: ['sam_single_person', 'tasks_per_hour', 'is_active'],
};

@Component({
  selector: 'app-stamping-sam',
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
    TableTemplate,
    CharSquare,
    UiTabs,
    UiSelect,
    UiCombobox,
    SamTargetCalculator,
    SamTargetCalculatorPanel,
  ],
  providers: [SamCalculatorStateService],
  templateUrl: './stamping-sam.html',
  styleUrl: './stamping-sam.css',
})
export class StampingSam extends BaseCrudPage<StampingReferenceSam> {
  protected override entityName: string = 'SAM';

  tabs = TABS;
  activeTab = signal('identification');
  references = signal<Reference[]>([]);
  machines = signal<StampingMachine[]>([]);
  pieces = signal<StampingPiece[]>([]);
  locations = signal<StampingLocation[]>([]);
  stampTypeDescriptions = signal<StampingStampTypeDescription[]>([]);
  fabricTypes = signal<StampingFabricType[]>([]);
  techniques = signal<StampingTechnique[]>([]);

  onTabChange(key: string): void {
    this.activeTab.set(key);
  }

  protected calcTasksPerHour(samSinglePerson: string | number | null): string | null {
    return calcSamTarget(samSinglePerson, 60, 1);
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

  private noReferenceSub?: Subscription;

  private wireNoReferenceDependency(): void {
    this.noReferenceSub?.unsubscribe();
    this.noReferenceSub = this.noReference!.valueChanges.subscribe((requiresReference) => {
      this.rowidItem?.setValue(null);
      this.identification?.setValue(null);
      this.syncRowidItemValidator(requiresReference);
    });
  }

  private syncRowidItemValidator(requiresReference = !!this.noReference?.value): void {
    this.rowidItem?.setValidators(requiresReference ? [Validators.required] : []);
    this.rowidItem?.updateValueAndValidity({ emitEvent: false });
  }

  protected override closeModelForm(): void {
    this.activeTab.set('identification');
    super.closeModelForm();
  }

  constructor(
    stampingReferenceSamService: StampingReferenceSamService,
    private referencesService: ReferencesService,
    private stampingMachineService: StampingMachineService,
    private stampingPieceService: StampingPieceService,
    private stampingLocationService: StampingLocationService,
    private stampingStampTypeDescriptionService: StampingStampTypeDescriptionService,
    private stampingFabricTypeService: StampingFabricTypeService,
    private stampingTechniqueService: StampingTechniqueService,
  ) {
    super(stampingReferenceSamService);
  }

  ngOnInit(): void {
    this.wslService.start();
    this.referencesService.getAll()
      .pipe(finalize(() => this.wslService.end()))
      .subscribe((references) => this.references.set(references));

    this.loadList(this.stampingMachineService, this.machines);
    this.loadList(this.stampingPieceService, this.pieces);
    this.loadList(this.stampingLocationService, this.locations);
    this.loadList(this.stampingStampTypeDescriptionService, this.stampTypeDescriptions);
    this.loadList(this.stampingFabricTypeService, this.fabricTypes);
    this.loadList(this.stampingTechniqueService, this.techniques);
  }

  protected override actionHandler(event: TableActionEvent<StampingReferenceSam>): void {
    super.actionHandler(event);
    if (event.type === 'edit') {
      this.modelForm.patchValue(
        {
          ...event.obj,
          no_reference: !!event.obj.rowid_item,
        },
        { emitEvent: false },
      );
      this.syncRowidItemValidator();
      this.noReference?.disable({ emitEvent: false });
    }
  }

  onReferenceSelect(event: { index: number; value: Reference }): void {
    if (!event.value) return;
    this.modelForm.patchValue({
      rowid_item: event.value.rowid_item,
      identification: event.value.reference,
    });

    if (this.actionType === 'create') {
      this.modelForm.patchValue({
        brand: event.value.brand,
        line: event.value.line,
        collection: event.value.collection,
        garment_type: event.value.group,
      });
    }
  }

  protected override get columns(): TableColumn<StampingReferenceSam>[] {
    return [
      { field: 'identification', label: 'Identificación' },
      { type: 'template', label: 'Referencia', templateName: 'referenceTemplate' },
      { field: 'machine_name', label: 'Máquina' },
      // { field: 'tasks_per_hour', label: 'Tarea/Hora (BD)', align: 'center' },
      { type: 'template', label: 'Tarea/Hora', templateName: 'tasksPerHourTemplate', align: 'center' },
      { type: 'template', label: 'SAM', templateName: 'samTemplate', align: 'center' },
    ];
  }

  protected override initializeModelForm(): void {
    this.modelForm = this.fb.group({
      no_reference: [true],
      rowid_item: [null, [Validators.required]],
      identification: [null, [Validators.required, Validators.minLength(2)]],
      machine: [null, [Validators.required]],
      people_count: [null, [Validators.required, Validators.min(1)]],
      piece: [null, [Validators.required]],
      stamped_pieces: [null, [Validators.required, Validators.min(1)]],
      sam_single_person: [null, [Validators.required, Validators.min(0.0001)]],
      tasks_per_hour: [null, [Validators.required, Validators.min(1)]],
      is_active: [null, this.actionType === 'edit' ? [Validators.required] : []],
      location: [null],
      stamp_type_description: [null],
      technique: [null],
      garment_type: [null],
      fabric_type: [null],
      line: [null],
      brand: [null],
      collection: [null],
      process: [null],
      frames: [null],
      inks: [null],
      prints: [null],
      pieces_per_board: [null],
      layout_form: [null],
      pre_dried: [null],
    });
    this.wireNoReferenceDependency();
  }

  get noReference() { return this.modelForm.get('no_reference'); }
  get rowidItem() { return this.modelForm.get('rowid_item'); }
  get identification() { return this.modelForm.get('identification'); }
  get machine() { return this.modelForm.get('machine'); }
  get peopleCount() { return this.modelForm.get('people_count'); }
  get piece() { return this.modelForm.get('piece'); }
  get stampedPieces() { return this.modelForm.get('stamped_pieces'); }
  get location() { return this.modelForm.get('location'); }
  get stampTypeDescription() { return this.modelForm.get('stamp_type_description'); }
  get technique() { return this.modelForm.get('technique'); }
  get garmentType() { return this.modelForm.get('garment_type'); }
  get fabricType() { return this.modelForm.get('fabric_type'); }
  get line() { return this.modelForm.get('line'); }
  get brand() { return this.modelForm.get('brand'); }
  get collection() { return this.modelForm.get('collection'); }
  get process() { return this.modelForm.get('process'); }
  get frames() { return this.modelForm.get('frames'); }
  get inks() { return this.modelForm.get('inks'); }
  get prints() { return this.modelForm.get('prints'); }
  get piecesPerBoard() { return this.modelForm.get('pieces_per_board'); }
  get layoutForm() { return this.modelForm.get('layout_form'); }
  get preDried() { return this.modelForm.get('pre_dried'); }
  get samSinglePerson() { return this.modelForm.get('sam_single_person'); }
  get tasksPerHour() { return this.modelForm.get('tasks_per_hour'); }
  get isActive() { return this.modelForm.get('is_active'); }

  protected override submit(): void {
    const { no_reference, ...formValue } = this.modelForm.value;
    const normalized = Object.fromEntries(
      Object.entries(formValue).map(([key, value]) => [key, value === '' ? null : value]),
    );
    const reference: Partial<StampingReferenceSam> = {
      ...normalized,
      is_active: this.isActive?.value ?? true,
    };
    super.submit(reference);
  }
}
