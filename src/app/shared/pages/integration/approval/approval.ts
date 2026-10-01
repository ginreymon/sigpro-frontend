import { Component, computed, signal, ViewChild } from '@angular/core';
import { DatePipe } from '@angular/common';
import { WorkSpaceLayout } from '../../../../layouts/work-space-layout/work-space-layout';
import { DataTable } from '../../../components/table/data-table/data-table';
import { SideModalLayout } from '../../../components/layout/side-modal-layout/side-modal-layout';
import { BaseCrudPage } from '../../../../common/classes/base-crud-page';
import { TableColumn } from '../../../../common/interfaces/table-column';
import { TableActions } from '../../../../common/interfaces/table-actions';
import { TableToolsButtons } from '../../../../common/interfaces/table-tools-buttons';
import { DateRangeForm, DateRangeValue } from '../../../components/form-controls/date-range-form/date-range-form';
import { localTodayStr } from '../../../../common/functions/date-utils';
import { UiButton } from '../../../elements/ui-button/ui-button';
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
    DateRangeForm,
    UiButton,
  ],
  templateUrl: './approval.html',
})
export class Approval extends BaseCrudPage<OrderToBeOutbound> {
  protected override entityName: string = 'OP pendiente de aprobación';

  // Reporte agregado de solo lectura (fn_totales_registrados_por_op_detalle):
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

  @ViewChild(DateRangeForm) private dateRangeForm?: DateRangeForm;

  // Rango elegido. Vive en la página y no en el formulario: mientras carga, el
  // layout reemplaza main-content por un esqueleto y el formulario se destruye
  // y se vuelve a crear; así recupera las fechas con las que se consultó.
  protected dateRange = signal<DateRangeValue | null>({
    startDate: localTodayStr(),
    endDate: localTodayStr(),
  });
  protected hasDateFilter = computed(() => this.dateRange() !== null);

  // Al abrir, solo los registros de hoy (una sola consulta, ya filtrada).
  protected override initialFilters(): Record<string, any> {
    const today = localTodayStr();
    return { date_from: today, date_to: today };
  }

  protected onDateRangeSearch(value: DateRangeValue): void {
    this.dateRange.set(value);
    this.filters = { date_from: value.startDate, date_to: value.endDate };
    this.page = 1;
    this.reload();
  }

  protected clearDateRange(): void {
    this.dateRange.set(null);
    this.dateRangeForm?.form.reset();
    this.filters = {};
    this.page = 1;
    this.reload();
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
      { field: 'day_number', label: 'Día' },
      { field: 'record_date', label: 'Fecha' },
      { field: 'code', label: 'Centro de trabajo' },
      { field: 'origin', label: 'Área' },
      { field: 'detail_count', label: 'OPs', align: 'right' },
    ];
  }
}
