import { Component, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { WorkSpaceLayout } from '../../../layouts/work-space-layout/work-space-layout';
import { DataTable } from '../../../shared/components/table/data-table/data-table';
import { Metadata } from '../../../shared/components/widgets/metadata/metadata';
import { SideModalLayout } from '../../../shared/components/layout/side-modal-layout/side-modal-layout';
import { UiAccordionItem } from '../../../shared/elements/ui-accordion-item/ui-accordion-item';
import { UiBadge, BadgeIntent } from '../../../shared/elements/ui-badge/ui-badge';
import { TableTemplate } from '../../../directives/table-template';
import { BaseCrudPage } from '../../../common/classes/base-crud-page';
import { TableColumn } from '../../../common/interfaces/table-column';
import { TableActions } from '../../../common/interfaces/table-actions';
import { TableToolsButtons } from '../../../common/interfaces/table-tools-buttons';
import { TepSubmission, TepSubmissionStatus } from '../../../models/integration/tep-submission';
import { TepSubmissionService } from '../../../services/integration/tep-submission-service';
import { CharSquare } from '../../../shared/components/widgets/char-square/char-square';
import { UiCopyText } from '../../../shared/elements/ui-copy-text/ui-copy-text';
import { formatDecimalHours } from '../../../common/functions/tep-time';
import { OpsPopover, OpsPopoverItem } from '../../../shared/components/widgets/ops-popover/ops-popover';
import { UiDisclosureTriangle } from '../../../shared/elements/ui-disclosure-triangle/ui-disclosure-triangle';

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
  imports: [WorkSpaceLayout, DataTable, Metadata, SideModalLayout, UiBadge, UiAccordionItem, TableTemplate, DatePipe, DecimalPipe, CharSquare, UiCopyText, OpsPopover, UiDisclosureTriangle],
  templateUrl: './siesa-outbound.html',
})
export class SiesaOutbound extends BaseCrudPage<TepSubmission> {
  protected override entityName: string = 'envío TEP';

  // Historial de envíos a SIESA (integration/tep/send/): solo lectura, sin
  // crear/editar/eliminar desde la UI.
  protected override get actions(): TableActions {
    return {
      view: { enabled: true, title: 'Detalle del documento', iconName: 'eye', toolTip: 'Ver' },
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

  private datePipe = new DatePipe('en-US');

  constructor(private tepSubmissionService: TepSubmissionService) {
    super(tepSubmissionService);
  }

  protected override get columns(): TableColumn<TepSubmission>[] {
    return [
      // `field` makes it the primary (leftmost) column of the compact table layout.
      { field: 'document_number', type: 'template', label: 'Documentos', templateName: 'siesaDocumentTemplate', filterValue: (r) => this.siesaDocument(r) },
      { type: 'template', label: 'Fecha', templateName: 'createdAtTemplate', filterValue: (r) => this.datePipe.transform(r.created_at, 'dd/MM/yyyy HH:mm') },
      { field: 'status_display', type: 'template', label: 'Estado', templateName: 'statusTemplate' },
      { field: 'work_center_id', label: 'Centro de trabajo', align: 'center' },
      { type: 'template', label: 'Respuesta', templateName: 'responseTemplate', filterValue: (r) => this.responseSummary(r) },
      { type: 'template', label: 'Órdenes', templateName: 'opsTemplate', align: 'center' },
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

  // Document sent to SIESA, displayed as "TPW-00000057" (number padded to 8 digits; stored value unchanged).
  // Historical submissions made before the backend assigned the consecutive have no usable number
  // (null or 0): shown as "—".
  protected siesaDocument(submission: Partial<Pick<TepSubmission, 'document_type_id' | 'document_number'>>): string {
    const { document_type_id: type, document_number: number } = submission;
    return type && number ? `${type}-${String(number).padStart(8, '0')}` : '—';
  }

  // OPs of a submission for the shared OPs popover (one entry per OP, a movement list can repeat it);
  // cached per row so the bound input keeps its reference.
  private readonly opItemsByRow = new WeakMap<TepSubmission, OpsPopoverItem[]>();

  protected opItems(submission: TepSubmission): OpsPopoverItem[] {
    let items = this.opItemsByRow.get(submission);
    if (!items) {
      // Time sent per OP: the sum of the hours of all its movements.
      const hoursByOp = new Map<string, number>();
      for (const detail of submission.details) {
        const title = `${detail.op_document_type_id} ${detail.op_document_number}`;
        hoursByOp.set(title, (hoursByOp.get(title) ?? 0) + Number(detail.hours));
      }
      items = [...hoursByOp].map(([title, hours]) => ({ key: title, title, time: formatDecimalHours(hours) }));
      this.opItemsByRow.set(submission, items);
    }
    return items;
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

  // Table cell version of the summary: at most 20 characters, ellipsis when cut (full text goes in the tooltip).
  protected shortResponse(submission: TepSubmission): string {
    const text = this.responseSummary(submission);
    return text.length > 20 ? `${text.slice(0, 20)}…` : text;
  }
}
