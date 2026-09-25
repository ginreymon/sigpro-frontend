import { Component } from '@angular/core';
import { DatePipe } from '@angular/common';
import { WorkSpaceLayout } from '../../../layouts/work-space-layout/work-space-layout';
import { DataTable } from '../../../shared/components/table/data-table/data-table';
import { SideModalLayout } from '../../../shared/components/layout/side-modal-layout/side-modal-layout';
import { BaseCrudPage } from '../../../common/classes/base-crud-page';
import { TableColumn } from '../../../common/interfaces/table-column';
import { TableActions } from '../../../common/interfaces/table-actions';
import { TableToolsButtons } from '../../../common/interfaces/table-tools-buttons';
import { OrderToBeOutbound } from '../../../models/integration/order-to-be-outbound';
import { OrdersToBeOutboundService } from '../../../services/integration/orders-to-be-outbound-service';

@Component({
  selector: 'app-approval',
  imports: [WorkSpaceLayout, DataTable, SideModalLayout, DatePipe],
  templateUrl: './approval.html',
})
export class Approval extends BaseCrudPage<OrderToBeOutbound> {
  protected override entityName: string = 'OP pendiente de aprobación';

  // Reporte agregado de solo lectura (sp_totales_registrados_por_op):
  // revisar antes de enviar a SIESA, sin crear/editar/eliminar desde la UI.
  protected override get actions(): TableActions {
    return {
      view: { enabled: true, title: 'Detalle de la OP', iconName: 'eye', toolTip: 'Ver detalle' },
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

  protected override get columns(): TableColumn<OrderToBeOutbound>[] {
    return [
      { field: 'op_number', label: 'OP', align: 'right' },
      { field: 'op_type', label: 'Tipo doc.' },
      { field: 'origin', label: 'Área de origen' },
      { field: 'ordered_quantity', label: 'Ordenada', align: 'right' },
      { field: 'total_completed', label: 'Completada', align: 'right' },
      { field: 'total_scrap', label: 'Desperdicio', align: 'right' },
      { field: 'total_rejected', label: 'Rechazada', align: 'right' },
      { field: 'pending_quantity', label: 'Pendiente', align: 'right' },
    ];
  }
}
