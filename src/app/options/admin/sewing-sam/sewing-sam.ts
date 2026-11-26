import { Component, signal } from '@angular/core';
import { ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { AdminOnlyCrudPage } from '../../../common/classes/admin-only-crud-page';
import { TableActionEvent } from '../../../common/interfaces/table-action-event';
import { TableActions } from '../../../common/interfaces/table-actions';
import { TableColumn } from '../../../common/interfaces/table-column';
import { TableToolsButtons } from '../../../common/interfaces/table-tools-buttons';
import { WorkSpaceLayout } from '../../../layouts/work-space-layout/work-space-layout';
import { ReferenceSam } from '../../../models/production/reference-sam';
import { SkuItemReference } from '../../../models/production/sku-item-reference';
import { ReferenceSamService } from '../../../services/production/reference-sam-service';
import { SkuItemReferenceService } from '../../../services/production/sku-item-reference-service';
import { CharSquare } from '../../../shared/components/widgets/char-square/char-square';
import { DataTable } from '../../../shared/components/table/data-table/data-table';
import { ModalLayout } from '../../../shared/components/layout/modal-layout/modal-layout';
import { SideModalLayout } from '../../../shared/components/layout/side-modal-layout/side-modal-layout';
import { TableTemplate } from '../../../directives/table-template';
import { UiErrorMessage } from '../../../shared/elements/ui-error-message/ui-error-message';
import { UiFormField } from '../../../shared/elements/ui-form-field/ui-form-field';
import { UiFormSection } from '../../../shared/elements/ui-form-section/ui-form-section';
import { UiInput } from '../../../shared/elements/ui-input/ui-input';
import { Metadata } from "../../../shared/components/widgets/metadata/metadata";
import { SamTargetCalculator } from '../../../shared/components/production/widgets/sam-target-calculator/sam-target-calculator';
import { SamTargetCalculatorPanel } from '../../../shared/components/production/widgets/sam-target-calculator/sam-target-calculator-panel';
import { SamCalculatorStateService } from '../../../shared/components/production/widgets/sam-target-calculator/sam-calculator-state';
import { InfoPanelLine, UiInfoPanel } from '../../../shared/elements/ui-info-panel/ui-info-panel';

@Component({
  selector: 'app-sewing-sam',
  imports: [WorkSpaceLayout, DataTable, ModalLayout, SideModalLayout, ReactiveFormsModule, UiErrorMessage, UiFormField, UiFormSection, UiInput, TableTemplate, CharSquare, Metadata, SamTargetCalculator, SamTargetCalculatorPanel, UiInfoPanel],
  providers: [SamCalculatorStateService],
  templateUrl: './sewing-sam.html',
  styleUrl: './sewing-sam.css',
})
export class SewingSAM extends AdminOnlyCrudPage<SkuItemReference> {
  protected override entityName: string = 'SAM';

  // Also embedded as a tab inside production/sewing-config (module 'production'),
  // not just its standalone route under admin — CRUD stays enabled there too.
  protected override get isAdminModule(): boolean {
    const moduleUrl = this.routeContext.currentModule?.url;
    return moduleUrl === 'admin' || moduleUrl === 'production';
  }

  samRecord = signal<Partial<ReferenceSam>>({});
  samRecordLoading = signal<boolean>(false);

  constructor(
    skuItemReferenceService: SkuItemReferenceService,
    private referenceSamService: ReferenceSamService,
  ) {
    super(skuItemReferenceService);
  }

  protected override get actions(): TableActions {
    if (!this.isAdminModule) return super.actions;
    return {
      view: { enabled: true, title: 'Referencia', iconName: 'eye', toolTip: 'Ver' },
      edit: { enabled: true, title: 'SAM', iconName: 'pencil', toolTip: 'SAM' },
      delete: { enabled: false },
      create: { enabled: false },
    };
  }

  protected override tableToolsButtons: TableToolsButtons = {
    filter: { enabled: false },
    columns: { enabled: false },
    export: { enabled: false },
    addItem: { enabled: false },
  };

  protected override get columns(): TableColumn<SkuItemReference>[] {
    return [
      { field: 'reference', label: 'Referencia' },
      { field: 'line', label: 'Línea' },
      { field: 'sewing', label: 'Centro de costo' },
      { field: 'sku_status', label: 'Estado' },
      { type: 'template', label: 'SAM', templateName: 'samTemplate' },
    ];
  }

  protected override initializeModelForm(): void {
    this.modelForm = this.fb.group({
      sam: [null, [Validators.required, Validators.min(0.0001)]],
    });
  }

  get sam() {
    return this.modelForm.get('sam');
  }

  get samInfoLines(): InfoPanelLine[] {
    return [
      { label: 'Referencia', value: this.rowObject.reference ?? '' },
      { label: 'Línea', value: this.rowObject.line ?? '' },
      { label: 'Centro de costo', value: this.rowObject.sewing ?? '' },
      { label: 'Descripción', value: this.rowObject.description ?? '' },
    ];
  }

  protected override actionHandler(event: TableActionEvent<SkuItemReference>): void {
    this.rowObject = event.obj;
    this.prepareFormForAction();

    if (event.type === 'view') {
      this.actionType = event.type;
      this.samRecord.set({});
      if (event.obj.sam_id) {
        this.samRecordLoading.set(true);
        this.referenceSamService.getById(event.obj.sam_id).pipe(finalize(() => this.samRecordLoading.set(false))).subscribe({
          next: (data) => this.samRecord.set(data),
        });
      }
      this.dialogService.openSideModal('Referencia', 'Cerrar');
    }

    if (event.type === 'edit') {
      this.actionType = event.type;
      const hasSam = !!event.obj.sam_id;
      const title = hasSam ? 'Editar SAM' : 'Asignar SAM';
      const acceptLabel = hasSam ? 'Actualizar' : 'Guardar';
      this.dialogService.openModal(title, acceptLabel);
      this.modelForm.patchValue({ sam: event.obj.sam_value });
    }
  }

  protected override submit(): void {
    if (!this.validateModelForm()) return;
    this.loaderService.showLoader();

    const isUpdate = !!this.rowObject.sam_id;

    const request$ = isUpdate
      ? this.referenceSamService.patch(this.rowObject.sam_id!, { sam: this.modelForm.value.sam })
      : this.referenceSamService.create({ rowid_item: this.rowObject.rowid_item!, sam: this.modelForm.value.sam });

    request$.subscribe({
      next: () => {
        this.closeModelForm();
        this.dialogService.openToast('Proceso exitoso', `SAM ${isUpdate ? 'actualizado' : 'asignado'} correctamente.`, 'check');
        this.reload(() => this.loaderService.hideLoader());
      },
      error: () => {
        this.loaderService.hideLoader();
        this.errorMessage.set('Ocurrió un error. Intente nuevamente.');
      },
    });
  }
}
