import { Component, inject, LOCALE_ID, signal } from '@angular/core';
import { DatePipe, DecimalPipe, formatDate, NgTemplateOutlet } from '@angular/common';
import { WorkSpaceLayout } from '../../../../layouts/work-space-layout/work-space-layout';
import { DataTable } from '../../../components/table/data-table/data-table';
import { SideModalLayout } from '../../../components/layout/side-modal-layout/side-modal-layout';
import { BaseCrudPage } from '../../../../common/classes/base-crud-page';
import { TableColumn } from '../../../../common/interfaces/table-column';
import { TableActions } from '../../../../common/interfaces/table-actions';
import { TableToolsButtons } from '../../../../common/interfaces/table-tools-buttons';
import { toLocalDate } from '../../../../common/functions/time-range';
import { UiAccordionItem } from '../../../elements/ui-accordion-item/ui-accordion-item';
import { UiBadge } from '../../../elements/ui-badge/ui-badge';
import { UiLabelButton } from '../../../elements/ui-label-button/ui-label-button';
import { UiOriginBadge } from '../../../elements/ui-origin-badge/ui-origin-badge';
import { CharSquare } from '../../../components/widgets/char-square/char-square';
import { TableTemplate } from '../../../../directives/table-template';
import { OrderByWorkCenter } from '../../../../models/integration/order-by-work-center';
import { OPERATIONS_LABEL } from '../../../../models/integration/order-to-be-outbound';
import { PaginatedResponse } from '../../../../common/interfaces/paginated-response';
import { OrdersByWorkCenterService } from '../../../../services/integration/orders-by-work-center-service';
import { UiIcon } from '../../../elements/ui-icon/ui-icon';

// Read-only view of orders-to-be-outbound/by-work-center: totals per work center
// with their documents (OPs), no day split.
@Component({
  selector: 'app-work-center-totals',
  imports: [
    WorkSpaceLayout,
    DataTable,
    SideModalLayout,
    NgTemplateOutlet,
    DatePipe,
    DecimalPipe,
    TableTemplate,
    UiAccordionItem,
    UiBadge,
    UiLabelButton,
    UiOriginBadge,
    CharSquare,
    UiIcon
],
  templateUrl: './work-center-totals.html',
})
export class WorkCenterTotals extends BaseCrudPage<OrderByWorkCenter> {
  protected override entityName: string = 'Centro de trabajo';
  protected readonly sourceName: string = 'SIESA';
  protected readonly targetName: string = 'SIGPRO';

  // first_start/last_end arrive in UTC without a zone suffix: toLocalDate marks
  // them as UTC so DatePipe shows local time.
  protected readonly toLocalDate = toLocalDate;
  protected readonly operationsLabel = OPERATIONS_LABEL;

  protected override get actions(): TableActions {
    return {
      view: { enabled: true, title: 'Detalle Centro de Trabajo', iconName: 'eye', toolTip: 'Ver' },
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

  constructor(ordersByWorkCenterService: OrdersByWorkCenterService) {
    super(ordersByWorkCenterService);
  }

  private readonly locale = inject(LOCALE_ID);

  protected override mapResponse(res: PaginatedResponse<OrderByWorkCenter>): PaginatedResponse<OrderByWorkCenter> {
    return {
      ...res,
      results: res.results.map((row) => {
        const lastEnd = toLocalDate(row.last_end);
        return { ...row, end_date: lastEnd ? formatDate(lastEnd, 'dd/MM/yyyy', this.locale) : undefined };
      }),
    };
  }

  protected expandedDocumentIndexes = signal<Set<number>>(new Set());

  protected override closeModelForm(): void {
    this.expandedDocumentIndexes.set(new Set());
    super.closeModelForm();
  }

  protected isDocumentExpanded(index: number): boolean {
    return this.expandedDocumentIndexes().has(index);
  }

  protected toggleDocumentExpanded(index: number): void {
    const expanded = new Set(this.expandedDocumentIndexes());
    if (!expanded.delete(index)) {
      expanded.add(index);
    }
    this.expandedDocumentIndexes.set(expanded);
  }

  protected override get columns(): TableColumn<OrderByWorkCenter>[] {
    return [
      { field: 'end_date', type: 'template', label: 'Fecha', templateName: 'lastEndTemplate' },
      { field: 'origin', type: 'template', label: 'Área', templateName: 'originTemplate' },
      { field: 'code', type: 'template', label: 'Centro de trabajo', templateName: 'workCenterTemplate' },
      { type: 'template', label: 'Órdenes', templateName: 'documentsTemplate', align: 'center' },
      { type: 'template', label: 'Acciones', templateName: 'integrateTemplate', align: 'center' },
    ];
  }
}
