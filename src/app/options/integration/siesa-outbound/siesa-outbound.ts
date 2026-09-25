import { Component } from '@angular/core';
import { DatePipe } from '@angular/common';
import { WorkSpaceLayout } from '../../../layouts/work-space-layout/work-space-layout';
import { DataTable } from '../../../shared/components/table/data-table/data-table';
import { Metadata } from '../../../shared/components/widgets/metadata/metadata';
import { SideModalLayout } from '../../../shared/components/layout/side-modal-layout/side-modal-layout';
import { UiBadge, BadgeIntent } from '../../../shared/elements/ui-badge/ui-badge';
import { TableTemplate } from '../../../directives/table-template';
import { BaseCrudPage } from '../../../common/classes/base-crud-page';
import { TableColumn } from '../../../common/interfaces/table-column';
import { TableActions } from '../../../common/interfaces/table-actions';
import { TableToolsButtons } from '../../../common/interfaces/table-tools-buttons';
import { SiesaOutboundDocument, SiesaOutboundDocumentStatus } from '../../../models/integration/siesa-outbound-document';
import { SiesaOutboundDocumentService } from '../../../services/integration/siesa-outbound-document-service';

const STATUS_INTENT: Record<SiesaOutboundDocumentStatus, BadgeIntent> = {
  pending: 'warning',
  sending: 'default',
  sent: 'active',
  failed: 'danger',
  poisoned: 'paused',
};

@Component({
  selector: 'app-siesa-outbound',
  imports: [WorkSpaceLayout, DataTable, Metadata, SideModalLayout, UiBadge, TableTemplate, DatePipe],
  templateUrl: './siesa-outbound.html',
})
export class SiesaOutbound extends BaseCrudPage<SiesaOutboundDocument> {
  protected override entityName: string = 'documento SIESA';

  // Outbox transaccional inmutable (ver docstring del modelo): solo lectura,
  // sin crear/editar/eliminar desde la UI.
  protected override get actions(): TableActions {
    return {
      view: { enabled: true, title: 'Detalle del documento', iconName: 'eye', toolTip: 'Ver detalle' },
      edit: { enabled: false },
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

  constructor(private siesaOutboundDocumentService: SiesaOutboundDocumentService) {
    super(siesaOutboundDocumentService);
  }

  protected override get columns(): TableColumn<SiesaOutboundDocument>[] {
    return [
      { field: 'document_type', label: 'Tipo doc.' },
      { field: 'idempotency_key', label: 'Clave idempotencia' },
      { field: 'op_number', label: 'OP', align: 'right' },
      { field: 'work_center_code', label: 'Centro trabajo' },
      { type: 'template', label: 'Estado', templateName: 'statusTemplate' },
      { field: 'attempts', label: 'Intentos', align: 'right' },
      { type: 'template', label: 'Enviado', templateName: 'sentAtTemplate' },
      { type: 'template', label: 'Creado', templateName: 'createdAtTemplate' },
    ];
  }

  protected statusIntent(status: SiesaOutboundDocumentStatus): BadgeIntent {
    return STATUS_INTENT[status] ?? 'default';
  }
}
