import { DecimalPipe } from '@angular/common';
import { Component, input } from '@angular/core';
import { WorkSpaceLayout } from '../../../../../layouts/work-space-layout/work-space-layout';
import { InfoCardTemplate } from '../../../../../template/info-card-template/info-card-template';
import { UiButton } from '../../../../elements/ui-button/ui-button';
import { UiIcon } from '../../../../elements/ui-icon/ui-icon';
import { StampingShiftSummary } from '../../../../components/production/cards/stamping-shift-summary/stamping-shift-summary';
import { StampingProgressSummary } from '../../../../components/production/cards/stamping-progress-summary/stamping-progress-summary';
import { WorkShiftSummary } from '../../../../components/production/cards/work-shift-summary/work-shift-summary';
import { OrderHeader } from '../../../../components/production/cards/order-header/order-header';
import { ProductionOrdersTable } from '../../../../components/production/tables/production-orders-table/production-orders-table';
import { TableTemplate } from '../../../../../directives/table-template';
import { ShiftCyclesFab } from '../../../../components/production/widgets/shift-cycles-fab/shift-cycles-fab';
import { OrderSearcher } from '../../../../components/production/widgets/order-searcher/order-searcher';
import { RecentRecordsCard } from '../../../../components/production/cards/recent-records-card/recent-records-card';
import { EmployeesModal } from '../../../../components/production/modals/employees-modal/employees-modal';
import { BalanceModal } from '../../../../components/production/modals/balance-modal/balance-modal';
import { StampingBalanceModal } from '../../../../components/production/modals/stamping-balance-modal/stamping-balance-modal';
import { PauseModal } from '../../../../components/production/modals/pause-modal/pause-modal';
import { ShiftTimeAlert } from '../../../../components/production/widgets/shift-time-alert/shift-time-alert';
import type { ShiftCycles } from '../shift-cycles/shift-cycles';

// Skeleton compartido entre app-shift-cycles y app-shift-cycles-manual: toda
// la estructura idéntica de ambas páginas (jornada no planificada, resumen +
// cabecera + tabla + action-bar, orden no disponible, buscador, cluster de
// modales) vive aquí una sola vez. Como Angular no soporta herencia de
// templates, el host se pasa entero via [page] (ambas páginas ya comparten
// ShiftCycles como clase base) y las piezas que sí difieren por página
// (quantity-modal vs quantity-duration-modal, shift-hourly-record,
// stamping-record vs stamping-record-manual, barra/modales de lotes
// manuales) se resuelven con content projection (slots por atributo).
@Component({
  selector: 'app-shift-cycles-shell',
  imports: [
    WorkSpaceLayout, InfoCardTemplate, UiButton, UiIcon, StampingShiftSummary, WorkShiftSummary, OrderHeader,
    ProductionOrdersTable, TableTemplate, ShiftCyclesFab, OrderSearcher, RecentRecordsCard, EmployeesModal,
    BalanceModal, StampingBalanceModal, PauseModal, ShiftTimeAlert, StampingProgressSummary, DecimalPipe,
  ],
  templateUrl: './shift-cycles-shell.html',
})
export class ShiftCyclesShell {
  page = input.required<ShiftCycles>();
}
