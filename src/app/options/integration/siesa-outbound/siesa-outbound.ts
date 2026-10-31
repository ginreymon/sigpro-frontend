import { Component, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { formatMinutesAsHHmm } from '../../../common/functions/time-range';
import { WorkSpaceLayout } from '../../../layouts/work-space-layout/work-space-layout';
import { DataTable } from '../../../shared/components/table/data-table/data-table';
import { Metadata } from '../../../shared/components/widgets/metadata/metadata';
import { SideModalLayout } from '../../../shared/components/layout/side-modal-layout/side-modal-layout';
import { UiAccordionItem } from '../../../shared/elements/ui-accordion-item/ui-accordion-item';
import { UiBadge, BadgeIntent } from '../../../shared/elements/ui-badge/ui-badge';
import { TableTemplate } from '../../../directives/table-template';
import { UiDisclosure } from '../../../shared/elements/ui-disclosure/ui-disclosure';
import { EllipsisPipe } from '../../../pipes/ellipsis-pipe';
import { BaseCrudPage } from '../../../common/classes/base-crud-page';
import { TableColumn } from '../../../common/interfaces/table-column';
import { TableActions } from '../../../common/interfaces/table-actions';
import { TableToolsButtons } from '../../../common/interfaces/table-tools-buttons';
import { TepSubmission, TepSubmissionStatus } from '../../../models/integration/tep-submission';
import { TepSubmissionService } from '../../../services/integration/tep-submission-service';
import { CharSquare } from '../../../shared/components/widgets/char-square/char-square';
import { OpSkuMatrixReadonly } from '../../../shared/components/widgets/op-sku-matrix-readonly/op-sku-matrix-readonly';

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
  imports: [WorkSpaceLayout, DataTable, Metadata, SideModalLayout, UiBadge, UiAccordionItem, TableTemplate, DatePipe, DecimalPipe, EllipsisPipe, UiDisclosure, CharSquare, OpSkuMatrixReadonly],
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
      { field: 'date', type: 'template', label: 'Fecha', templateName: 'createdAtTemplate' },
      { field: 'work_center_id', label: 'Centro de trabajo' },
      { type: 'template', label: 'Respuesta', templateName: 'responseTemplate' },
      { type: 'template', label: 'Documentos', templateName: 'opsTemplate', align: 'center' },
      { field: 'status_display', type: 'template', label: 'Estado', templateName: 'statusTemplate' },
    ];
  }

  protected expandedItems = signal<Set<string>>(new Set());

  protected override closeModelForm(): void {
    this.expandedItems.set(new Set());
    super.closeModelForm();
  }

  protected isExpanded(key: string): boolean {
    return this.expandedItems().has(key);
  }

  protected toggleExpanded(key: string): void {
    const expanded = new Set(this.expandedItems());
    if (!expanded.delete(key)) {
      expanded.add(key);
    }
    this.expandedItems.set(expanded);
  }

  protected statusIntent(status: TepSubmissionStatus): BadgeIntent {
    return STATUS_INTENT[status] ?? 'default';
  }

  // Decimal hours (API string) as HH:MM.
  protected hoursLabel(hours: string | number): string {
    return formatMinutesAsHHmm(Math.round(Number(hours) * 60));
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
