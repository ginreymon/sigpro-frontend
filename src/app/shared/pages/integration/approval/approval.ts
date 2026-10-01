import { Component, computed, signal, ViewChild } from '@angular/core';
import { DatePipe } from '@angular/common';
import { WorkSpaceLayout } from '../../../../layouts/work-space-layout/work-space-layout';
import { DataTable } from '../../../components/table/data-table/data-table';
import { SideModalLayout } from '../../../components/layout/side-modal-layout/side-modal-layout';
import { ModalLayout } from '../../../components/layout/modal-layout/modal-layout';
import { BaseCrudPage } from '../../../../common/classes/base-crud-page';
import { TableColumn } from '../../../../common/interfaces/table-column';
import { TableActions } from '../../../../common/interfaces/table-actions';
import { TableToolsButtons } from '../../../../common/interfaces/table-tools-buttons';
import { DateRangeForm, DateRangeValue } from '../../../components/form-controls/date-range-form/date-range-form';
import { localTodayStr } from '../../../../common/functions/date-utils';
import { toLocalDate } from '../../../../common/functions/time-range';
import { UiButton } from '../../../elements/ui-button/ui-button';
import { UiLabelButton } from '../../../elements/ui-label-button/ui-label-button';
import { OpTotalsTable } from '../../../components/widgets/op-totals-table/op-totals-table';
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
    ModalLayout,
    DatePipe,
    TableTemplate,
    UiAccordionItem,
    UiBadge,
    CharSquare,
    DateRangeForm,
    UiButton,
    UiLabelButton,
    OpTotalsTable,
  ],
  templateUrl: './approval.html',
})
export class Approval extends BaseCrudPage<OrderToBeOutbound> {
  protected override entityName: string = 'OP pendiente de aprobación';

  // first_start/last_end llegan en UTC sin sufijo de zona: toLocalDate los marca
  // como UTC para que DatePipe los muestre en hora local.
  protected readonly toLocalDate = toLocalDate;

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

  // Horas digitadas por op_rowid, por día y centro de trabajo. Las comparten la
  // tabla de la fila y la del modal de Enviar TEP.
  protected opHours = signal<Partial<Record<string, Partial<Record<number, string>>>>>({});

  protected opHoursKey(row: Partial<OrderToBeOutbound>): string {
    return `${row.record_date}:${row.code}`;
  }

  protected setOpHours(row: Partial<OrderToBeOutbound>, hours: Partial<Record<number, string>>): void {
    this.opHours.update((all) => ({ ...all, [this.opHoursKey(row)]: hours }));
  }

  protected approve(row: OrderToBeOutbound): void {
    this.rowObject = row;
    const title = [row.code,'·', row.description].filter(Boolean).map((text) => text!.trim()).join(' ');
    this.dialogService.openModal(title, 'Enviar');
  }

  // Al enviar se pide confirmación: el envío no se puede deshacer. Abrir la
  // confirmación cierra el modal (DialogService.closeAll).
  protected confirmSend(): void {
    this.dialogService.openConfirm(
      'Enviar TEP',
      'Al confirmar, el envío no se puede deshacer. ¿Desea continuar?',
      'Confirmar',
      () => this.dialogService.closeConfirm(),
    );
  }

  // Badge de la fecha: dos colores según la paridad de day_number.
  protected dateBadgeClass(row: OrderToBeOutbound): string {
    return row.day_number != null && row.day_number % 2 === 0
      ? 'text-green-700 bg-green-100'
      : 'text-brand-700 bg-brand-100';
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
      { type: 'template', label: 'Fecha', templateName: 'dayTemplate' },
      { field: 'origin', label: 'Área' },
      { type: 'template', label: 'Centro de trabajo', templateName: 'workCenterTemplate' },      
      { type: 'template', label: 'Registrado por OP', templateName: 'opsTotalsTemplate' },
      { type: 'template', label: 'Acciones', templateName: 'approveTemplate', align: 'center' },
    ];
  }
}
