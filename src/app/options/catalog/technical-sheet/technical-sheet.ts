import { Component } from '@angular/core';
import { TitleCasePipe, DatePipe } from '@angular/common';
import { TableTemplate } from '../../../directives/table-template';
import { UiBadge } from '../../../shared/elements/ui-badge/ui-badge';
import { UiTooltip } from '../../../shared/elements/ui-tooltip/ui-tooltip';
import { WorkSpaceLayout } from '../../../layouts/work-space-layout/work-space-layout';
import { BaseCrudPage } from '../../../common/classes/base-crud-page';
import { DataTable } from '../../../shared/components/data-table/data-table';
import { SideModalLayout } from '../../../shared/components/side-modal-layout/side-modal-layout';
import { CharSquare } from '../../../shared/components/char-square/char-square';
import { TechnicalSheet } from '../../../models/catalog/technical-sheet';
import { TechnicalSheetService } from '../../../services/catalog/technical-sheet-service';
import { TableColumn } from '../../../common/interfaces/table-column';
import { TableActions } from '../../../common/interfaces/table-actions';
import { TableToolsButtons } from '../../../common/interfaces/table-tools-buttons';
import { Metadata } from "../../../shared/components/metadata/metadata";

@Component({
  selector: 'app-technical-sheet',
  imports: [WorkSpaceLayout, DataTable, SideModalLayout, CharSquare, UiTooltip, UiBadge, TitleCasePipe, DatePipe, TableTemplate, Metadata],
  templateUrl: './technical-sheet.html',
  styleUrl: './technical-sheet.css',
})
export class TechnicalSheetPage extends BaseCrudPage<TechnicalSheet> {
  protected override entityName = 'ficha técnica';

  constructor(private technicalSheetService: TechnicalSheetService) {
    super(technicalSheetService);
  }

  get sheet(): TechnicalSheet {
    return this.rowObject as TechnicalSheet;
  }

  protected override get actions(): TableActions {
    return {
      view:   { enabled: true,  title: 'Ver ficha técnica', iconName: 'eye',    toolTip: 'Ver' },
      edit:   { enabled: false, title: '',                   iconName: 'pencil', toolTip: '' },
      delete: { enabled: false, title: '',                   iconName: 'trash',  toolTip: '' },
      create: { enabled: false, title: '' },
    };
  }

  protected override tableToolsButtons: TableToolsButtons = {
    filter:  { enabled: false },
    columns: { enabled: false },
    export:  { enabled: false },
    addItem: { enabled: false },
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
    this.modelForm = this.fb.group({});
  }
}
