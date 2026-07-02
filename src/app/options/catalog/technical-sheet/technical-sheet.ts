import { Component, signal } from '@angular/core';
import { TitleCasePipe, DatePipe } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { forkJoin, finalize } from 'rxjs';
import { TableTemplate } from '../../../directives/table-template';
import { UiBadge } from '../../../shared/elements/ui-badge/ui-badge';
import { UiTooltip } from '../../../shared/elements/ui-tooltip/ui-tooltip';
import { WorkSpaceLayout } from '../../../layouts/work-space-layout/work-space-layout';
import { BaseCrudPage } from '../../../common/classes/base-crud-page';
import { DataTable } from '../../../shared/components/data-table/data-table';
import { SideModalLayout } from '../../../shared/components/side-modal-layout/side-modal-layout';
import { ModalLayout } from '../../../shared/components/modal-layout/modal-layout';
import { CharSquare } from '../../../shared/components/char-square/char-square';
import { TechnicalSheet } from '../../../models/catalog/technical-sheet';
import { SheetMeasurement } from '../../../models/catalog/sheet-measurement';
import { SheetElasticCut } from '../../../models/catalog/sheet-elastic-cut';
import { TechnicalSheetService } from '../../../services/catalog/technical-sheet-service';
import { SheetMeasurementService } from '../../../services/catalog/sheet-measurement-service';
import { SheetElasticCutService } from '../../../services/catalog/sheet-elastic-cut-service';
import { TableColumn } from '../../../common/interfaces/table-column';
import { TableActions } from '../../../common/interfaces/table-actions';
import { TableToolsButtons } from '../../../common/interfaces/table-tools-buttons';
import { TableActionEvent } from '../../../common/interfaces/table-action-event';
import { SheetSideInfo } from '../components/sheet-side-info/sheet-side-info';
import { SheetDetail } from '../components/sheet-detail/sheet-detail';

@Component({
  selector: 'app-technical-sheet',
  imports: [
    WorkSpaceLayout, DataTable, SideModalLayout, ModalLayout,
    UiBadge, ReactiveFormsModule, TitleCasePipe, DatePipe, TableTemplate,
    SheetSideInfo, SheetDetail,
  ],
  templateUrl: './technical-sheet.html',
  styleUrl: './technical-sheet.css',
})
export class TechnicalSheetPage extends BaseCrudPage<TechnicalSheet> {
  protected override entityName = 'ficha técnica';

  measurements = signal<SheetMeasurement[]>([]);
  elasticCuts  = signal<SheetElasticCut[]>([]);

  constructor(
    private technicalSheetService: TechnicalSheetService,
    private sheetMeasurementService: SheetMeasurementService,
    private sheetElasticCutService: SheetElasticCutService,
  ) {
    super(technicalSheetService);
  }

  get sheet(): TechnicalSheet {
    return this.rowObject as TechnicalSheet;
  }

  protected override get actions(): TableActions {
    return {
      view:   { enabled: true,  title: 'Ver ficha técnica',    iconName: 'eye',    toolTip: 'Ver' },
      edit:   { enabled: true,  title: 'Editar ficha técnica', iconName: 'pencil', toolTip: 'Editar' },
      delete: { enabled: false, title: '',                      iconName: 'trash',  toolTip: '' },
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
      referenceId: [null],
      collectionId: [null],
      statusId: [null],
    });
  }

  protected override actionHandler(event: TableActionEvent<TechnicalSheet>): void {
    super.actionHandler(event);

    this.measurements.set([]);
    this.elasticCuts.set([]);

    if (event.type === 'edit') {
      this.loaderService.showLoader();
      forkJoin({
        measurements: this.sheetMeasurementService.getAll({ filters: { sheet_id: event.obj.rowid }, limit: 500 }),
        elasticCuts:  this.sheetElasticCutService.getAll({ filters: { sheet_id: event.obj.rowid }, limit: 500 }),
      }).pipe(finalize(() => this.loaderService.hideLoader())).subscribe({
        next: ({ measurements, elasticCuts }) => {
          this.measurements.set(measurements.results);
          this.elasticCuts.set(elasticCuts.results);
        },
      });
    }
  }

}

