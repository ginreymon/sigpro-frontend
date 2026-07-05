import { Component, signal } from '@angular/core';
import { TitleCasePipe, DatePipe } from '@angular/common';
import { ViewChild } from '@angular/core';
import { ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { TableTemplate } from '../../../directives/table-template';
import { UiBadge } from '../../../shared/elements/ui-badge/ui-badge';
import { WorkSpaceLayout } from '../../../layouts/work-space-layout/work-space-layout';
import { BaseCrudPage } from '../../../common/classes/base-crud-page';
import { DataTable } from '../../../shared/components/data-table/data-table';
import { SideModalLayout } from '../../../shared/components/side-modal-layout/side-modal-layout';
import { ModalLayout } from '../../../shared/components/modal-layout/modal-layout';
import { TechnicalSheet } from '../../../models/catalog/technical-sheet';
import { SheetMeasurement } from '../../../models/catalog/sheet-measurement';
import { SheetElasticCut } from '../../../models/catalog/sheet-elastic-cut';
import { Reference } from '../../../models/catalog/reference';
import { Collection } from '../../../models/catalog/collection';
import { TechnicalSheetStatus } from '../../../models/catalog/technical-sheet-status';
import { TechnicalSheetService } from '../../../services/catalog/technical-sheet-service';
import { TechnicalSheetDataService } from '../../../services/catalog/technical-sheet-data-service';
import { ReferencesService } from '../../../services/catalog/references-service';
import { CollectionService } from '../../../services/catalog/collection-service';
import { TechnicalSheetStatusService } from '../../../services/catalog/technical-sheet-status-service';
import { TableColumn } from '../../../common/interfaces/table-column';
import { TableActions } from '../../../common/interfaces/table-actions';
import { TableToolsButtons } from '../../../common/interfaces/table-tools-buttons';
import { TableActionEvent } from '../../../common/interfaces/table-action-event';
import { SheetSideInfo } from '../components/sheet-side-info/sheet-side-info';
import { SheetDetail } from '../components/sheet-detail/sheet-detail';
import { UiFormField } from "../../../shared/elements/ui-form-field/ui-form-field";
import { UiErrorMessage } from "../../../shared/elements/ui-error-message/ui-error-message";
import { UiSelect } from "../../../shared/elements/ui-select/ui-select";

@Component({
  selector: 'app-technical-sheet',
  imports: [
    WorkSpaceLayout, DataTable, SideModalLayout, ModalLayout,
    UiBadge, ReactiveFormsModule, TitleCasePipe, DatePipe, TableTemplate,
    SheetSideInfo, SheetDetail,
    UiFormField,
    UiErrorMessage,
    UiSelect
],
  templateUrl: './technical-sheet.html',
  styleUrl: './technical-sheet.css',
})
export class TechnicalSheetPage extends BaseCrudPage<TechnicalSheet> {
  protected override entityName = 'ficha técnica';

  @ViewChild(SheetDetail) private sheetDetail?: SheetDetail;

  measurements = signal<SheetMeasurement[]>([]);
  elasticCuts  = signal<SheetElasticCut[]>([]);
  references = signal<Reference[]>([]);
  collections = signal<Collection[]>([]);
  statuses = signal<TechnicalSheetStatus[]>([]);

  constructor(
    technicalSheetService: TechnicalSheetService,
    private technicalSheetDataService: TechnicalSheetDataService,
    private referencesService: ReferencesService,
    private collectionService: CollectionService,
    private technicalSheetStatusService: TechnicalSheetStatusService,
  ) {
    super(technicalSheetService);
  }

  ngOnInit(): void {
    this.loadCatalogs();
  }

  get sheet(): TechnicalSheet {
    return this.rowObject as TechnicalSheet;
  }

  protected override get actions(): TableActions {
    return {
      view:   { enabled: true,  title: 'Ver ficha técnica',    iconName: 'eye',    toolTip: 'Ver' },
      edit:   { enabled: true,  title: 'Editar ficha técnica', iconName: 'pencil', toolTip: 'Editar' },
      delete: { enabled: false, title: '', iconName: 'trash',  toolTip: '' },
      create: { enabled: true,  title: 'Nueva ficha técnica' },
    };
  }

  protected override tableToolsButtons: TableToolsButtons = {
    filter:  { enabled: false },
    columns: { enabled: false },
    export:  { enabled: false },
    addItem: { enabled: true },
  };

  protected override get columns(): TableColumn<TechnicalSheet>[] {
    return [
      { field: 'reference',     label: 'Referencia' },
      { field: 'description',   label: 'Descripción' },
      { field: 'brand',         label: 'Marca' },
      { field: 'sheet_version', label: 'Versión' },
      { label: 'Fecha creación', type: 'template', templateName: 'createdAtTemplate' },
      { label: 'Estado', type: 'template', templateName: 'statusTemplate' },
      { field: 'collection',    label: 'Colección' },
    ];
  }

  protected override initializeModelForm(): void {
    this.modelForm = this.fb.group({
      referenceId: [null, [Validators.required]],
      collectionId: [null, [Validators.required]],
      statusId: [null, [Validators.required]],
    });
  }

  get referenceId() {
    return this.modelForm.get('referenceId');
  }

  get collectionId() {
    return this.modelForm.get('collectionId');
  }

  get statusId() {
    return this.modelForm.get('statusId');
  }

  private loadCatalogs(): void {
    this.wslService.start();
    this.referencesService.getAll()
      .pipe(finalize(() => this.wslService.end()))
      .subscribe((references) => this.references.set(references));

    this.loadList(this.collectionService, this.collections);
    this.loadList(this.technicalSheetStatusService, this.statuses);
  }

  protected override actionHandler(event: TableActionEvent<TechnicalSheet>): void {
    this.measurements.set([]);
    this.elasticCuts.set([]);

    if (event.type === 'create') {
      this.sheetDetail?.reset();
      super.actionHandler({ ...event, obj: {} as TechnicalSheet });
      return;
    }

    super.actionHandler(event);

    if (event.type === 'edit' || event.type === 'view') {
      this.loaderService.showLoader();
      this.technicalSheetDataService.getBySheetId(event.obj.rowid)
        .pipe(finalize(() => this.loaderService.hideLoader()))
        .subscribe({
          next: (data) => {
            this.measurements.set(data.measurements ?? []);
            this.elasticCuts.set(data.elasticCutMeasures ?? []);
          },
        });
    }
  }

}

