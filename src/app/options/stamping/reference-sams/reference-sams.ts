import { Component, signal } from '@angular/core';
import { WorkSpaceLayout } from '../../../layouts/work-space-layout/work-space-layout';
import { DataTable } from '../../../shared/components/data-table/data-table';
import { UiErrorMessage } from '../../../shared/elements/ui-error-message/ui-error-message';
import { Metadata } from '../../../shared/components/metadata/metadata';
import { BaseCrudPage } from '../../../common/classes/base-crud-page';
import { StampingReferenceSam } from '../../../models/stamping/stamping-reference-sam';
import { ModalLayout } from '../../../shared/components/modal-layout/modal-layout';
import { SideModalLayout } from '../../../shared/components/side-modal-layout/side-modal-layout';
import { ReactiveFormsModule, Validators } from '@angular/forms';
import { StampingReferenceSamService } from '../../../services/stamping/stamping-reference-sam-service';
import { UiFormField } from '../../../shared/elements/ui-form-field/ui-form-field';
import { UiInput } from '../../../shared/elements/ui-input/ui-input';
import { UiCheckbox } from '../../../shared/elements/ui-checkbox/ui-checkbox';
import { UiBadge } from '../../../shared/elements/ui-badge/ui-badge';
import { TableTemplate } from '../../../directives/table-template';
import { CharSquare } from '../../../shared/components/char-square/char-square';
import { TableColumn } from '../../../common/interfaces/table-column';
import { UiTabs, TabItem } from '../../../shared/elements/ui-tabs/ui-tabs';

const TABS: TabItem[] = [
  { key: 'identification', label: 'Identificación' },
  { key: 'production', label: 'Producción' },
  { key: 'classification', label: 'Clasificación' },
  { key: 'process', label: 'Proceso técnico' },
  { key: 'sam', label: 'SAM' },
];

@Component({
  selector: 'app-reference-sams',
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
    UiTabs,
  ],
  templateUrl: './reference-sams.html',
  styleUrl: './reference-sams.css',
})
export class ReferenceSams extends BaseCrudPage<StampingReferenceSam> {
  protected override entityName: string = 'referencia SAM de estampación';

  tabs = TABS;
  activeTab = signal('identification');

  onTabChange(key: string): void {
    this.activeTab.set(key);
  }

  protected override closeModelForm(): void {
    this.activeTab.set('identification');
    super.closeModelForm();
  }

  constructor(private stampingReferenceSamService: StampingReferenceSamService) {
    super(stampingReferenceSamService);
  }

  protected override get columns(): TableColumn<StampingReferenceSam>[] {
    return [
      { field: 'identification', label: 'Identificación' },
      { field: 'machine', label: 'Máquina' },
      { field: 'process', label: 'Proceso' },
      { field: 'sam_single_person', label: 'SAM' },
      { field: 'tasks_per_hour', label: 'Tareas/hora' },
      { type: 'template', label: 'Estado', templateName: 'statusTemplate' },
    ];
  }

  protected override initializeModelForm(): void {
    this.modelForm = this.fb.group({
      rowid_item: [null, [Validators.required]],
      identification: [null, [Validators.required, Validators.minLength(2)]],
      machine: [null, [Validators.required]],
      people_count: [null, [Validators.required, Validators.min(1)]],
      piece: [null, [Validators.required]],
      stamped_pieces: [null, [Validators.required, Validators.min(1)]],
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
      sam_single_person: [null, [Validators.required, Validators.min(0.0001)]],
      tasks_per_hour: [null, [Validators.required, Validators.min(1)]],
      is_active: [null, this.actionType === 'edit' ? [Validators.required] : []],
    });
  }

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
    const reference: Partial<StampingReferenceSam> = {
      ...this.modelForm.value,
      is_active: this.isActive?.value ?? true,
    };
    super.submit(reference);
  }
}
