import { Component, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { WorkSpaceLayout } from '../../../../layouts/work-space-layout/work-space-layout';
import { DataTable } from '../../../components/table/data-table/data-table';
import { SideModalLayout } from '../../../components/layout/side-modal-layout/side-modal-layout';
import { BaseCrudPage } from '../../../../common/classes/base-crud-page';
import { TableColumn } from '../../../../common/interfaces/table-column';
import { TableActions } from '../../../../common/interfaces/table-actions';
import { TableToolsButtons } from '../../../../common/interfaces/table-tools-buttons';
import { UiAccordionItem } from '../../../elements/ui-accordion-item/ui-accordion-item';
import { UiBadge } from '../../../elements/ui-badge/ui-badge';
import { CharSquare } from '../../../components/widgets/char-square/char-square';
import { TableTemplate } from '../../../../directives/table-template';
import { OrderToBeOutbound } from '../../../../models/integration/order-to-be-outbound';
import { OrdersToBeOutboundService } from '../../../../services/integration/orders-to-be-outbound-service';

@Component({
  selector: 'app-approval',
  imports: [
    WorkSpaceLayout,
    DataTable,
    SideModalLayout,
    DatePipe,
    TableTemplate,
    UiAccordionItem,
    UiBadge,
    CharSquare,
  ],
  templateUrl: './approval.html',
})
export class Approval extends BaseCrudPage<OrderToBeOutbound> {
  protected override entityName: string = 'OP pendiente de aprobación';

  // Reporte agregado de solo lectura (sp_totales_registrados_por_op):
  // revisar antes de enviar a SIESA, sin crear/editar/eliminar desde la UI.
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

  constructor(private ordersToBeOutboundService: OrdersToBeOutboundService) {
    super(ordersToBeOutboundService);
  }

  protected expandedDetailIndexes = signal<Set<number>>(new Set());

  protected override closeModelForm(): void {
    this.expandedDetailIndexes.set(new Set());
    super.closeModelForm();
  }

  protected isDetailExpanded(index: number): boolean {
    return this.expandedDetailIndexes().has(index);
  }

  protected toggleDetailExpanded(index: number): void {
    const expanded = new Set(this.expandedDetailIndexes());
    if (!expanded.delete(index)) {
      expanded.add(index);
    }
    this.expandedDetailIndexes.set(expanded);
  }

  protected override get columns(): TableColumn<OrderToBeOutbound>[] {
    return [
      { type: 'template', label: 'Fecha fin', templateName: 'lastEndTemplate' },
      { type: 'template', label: 'Fecha inicio', templateName: 'firstStartTemplate' },
      { field: 'code', label: 'Centro de trabajo' },
      { field: 'origin', label: 'Área' },
      { field: 'detail_count', label: 'OPs', align: 'right' },
    ];
  }
}
