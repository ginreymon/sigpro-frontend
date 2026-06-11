import { Component } from '@angular/core';
import { ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { BaseCrudPage } from '../../../common/classes/base-crud-page';
import { TableActionEvent } from '../../../common/interfaces/table-action-event';
import { TableActions } from '../../../common/interfaces/table-actions';
import { TableColumn } from '../../../common/interfaces/table-column';
import { TableToolsButtons } from '../../../common/interfaces/table-tools-buttons';
import { WorkSpaceLayout } from '../../../layouts/work-space-layout/work-space-layout';
import { SkuItemReference } from '../../../models/production/sku-item-reference';
import { ReferenceSamService } from '../../../services/production/reference-sam-service';
import { SkuItemReferenceService } from '../../../services/production/sku-item-reference-service';
import { CharSquare } from '../../../shared/components/char-square/char-square';
import { DataTable } from '../../../shared/components/data-table/data-table';
import { ModalLayout } from '../../../shared/components/modal-layout/modal-layout';
import { SideModalLayout } from '../../../shared/components/side-modal-layout/side-modal-layout';
import { TableTemplate } from '../../../directives/table-template';
import { UiErrorMessage } from '../../../shared/elements/ui-error-message/ui-error-message';
import { UiFormField } from '../../../shared/elements/ui-form-field/ui-form-field';
import { UiInput } from '../../../shared/elements/ui-input/ui-input';

@Component({
  selector: 'app-sewing-sam',
  imports: [ WorkSpaceLayout, DataTable, ModalLayout, SideModalLayout, ReactiveFormsModule, UiErrorMessage, UiFormField, UiInput, TableTemplate, CharSquare, ],
  templateUrl: './sewing-sam.html',
  styleUrl: './sewing-sam.css',
})
export class SewingSAM extends BaseCrudPage<SkuItemReference> {
  protected override entityName: string = 'SAM';

  constructor(
    skuItemReferenceService: SkuItemReferenceService,
    private referenceSamService: ReferenceSamService,
  ) {
    super(skuItemReferenceService);
  }

  protected override get actions(): TableActions {
    return {
      view: { enabled: true, title: 'Ver Referencia', iconName: 'eye', toolTip: 'Ver' },
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

  protected override actionHandler(event: TableActionEvent<SkuItemReference>): void {
    this.rowObject = event.obj;
    this.prepareFormForAction();

    if (event.type === 'view') {
      this.actionType = event.type;
      this.dialogService.openSideModal('Ver Referencia', 'Cerrar');
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

    request$.pipe(finalize(() => this.reload(() => this.loaderService.hideLoader()))).subscribe({
      next: () => {
        this.closeModelForm();
        this.dialogService.openToast('Proceso exitoso', `SAM ${isUpdate ? 'actualizado' : 'asignado'} correctamente.`, 'check');
      },
      error: () => {
        this.errorMessage.set('Ocurrió un error. Intente nuevamente.');
      },
    });
  }
}
