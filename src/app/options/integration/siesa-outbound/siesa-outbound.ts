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
import { TepSubmission, TepSubmissionStatus } from '../../../models/integration/tep-submission';
import { TepSubmissionService } from '../../../services/integration/tep-submission-service';

const STATUS_INTENT: Record<TepSubmissionStatus, BadgeIntent> = {
  pending: 'warning',
  sent: 'active',
  failed: 'danger',
};

const ORIGIN_LABEL: Record<number, string> = {
  1: 'Confección',
  2: 'Estampación',
};

@Component({
  selector: 'app-siesa-outbound',
  imports: [WorkSpaceLayout, DataTable, Metadata, SideModalLayout, UiBadge, TableTemplate, DatePipe],
  templateUrl: './siesa-outbound.html',
})
export class SiesaOutbound extends BaseCrudPage<TepSubmission> {
  protected override entityName: string = 'envío TEP';

  // Historial de envíos a SIESA (integration/tep/send/): solo lectura, sin
  // crear/editar/eliminar desde la UI.
  protected override get actions(): TableActions {
    return {
      view: { enabled: true, title: 'Detalle del envío', iconName: 'eye', toolTip: 'Ver' },
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

  constructor(private tepSubmissionService: TepSubmissionService) {
    super(tepSubmissionService);
  }

  protected override get columns(): TableColumn<TepSubmission>[] {
    return [
      { type: 'template', label: 'Fecha', templateName: 'createdAtTemplate' },
      { field: 'work_center_id', label: 'Centro de trabajo' },
      { type: 'template', label: 'Documentos', templateName: 'opsTemplate', align: 'center' },
      { type: 'template', label: 'Estado', templateName: 'statusTemplate' },
      { type: 'template', label: 'Respuesta SIESA', templateName: 'responseTemplate' },
    ];
  }

  protected statusIntent(status: TepSubmissionStatus): BadgeIntent {
    return STATUS_INTENT[status] ?? 'default';
  }

  protected originLabel(originId: number | null): string {
    return originId != null ? (ORIGIN_LABEL[originId] ?? `${originId}`) : '—';
  }

  // Resumen de la respuesta de SIESA para la tabla: el primer mensaje del
  // dataset de error o, si no hay dataset (XML / error de red), el texto crudo.
  protected responseSummary(submission: TepSubmission): string {
    if (submission.status === 'sent') return 'Sin errores';
    if (submission.status === 'pending') return 'Sin respuesta';
    return submission.siesa_messages[0]?.detail ?? submission.error_detail ?? '—';
  }
}
