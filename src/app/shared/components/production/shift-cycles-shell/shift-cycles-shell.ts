import { Component, input } from '@angular/core';
import { WorkSpaceLayout } from '../../../../layouts/work-space-layout/work-space-layout';
import { InfoCardTemplate } from '../../../../template/info-card-template/info-card-template';
import { UiButton } from '../../../elements/ui-button/ui-button';
import { UiIcon } from '../../../elements/ui-icon/ui-icon';
import { StampingShiftSummary } from '../cards/stamping-shift-summary/stamping-shift-summary';
import { WorkShiftSummary } from '../cards/work-shift-summary/work-shift-summary';
import { OrderHeader } from '../cards/order-header/order-header';
import { ProductionOrdersTable } from '../tables/production-orders-table/production-orders-table';
import { TableTemplate } from '../../../../directives/table-template';
import { ShiftCyclesFab } from '../widgets/shift-cycles-fab/shift-cycles-fab';
import { OrderSearcher } from '../widgets/order-searcher/order-searcher';
import { RecentRecordsCard } from '../cards/recent-records-card/recent-records-card';
import { EmployeesModal } from '../modals/employees-modal/employees-modal';
import { BalanceModal } from '../modals/balance-modal/balance-modal';
import { StampingBalanceModal } from '../modals/stamping-balance-modal/stamping-balance-modal';
import { PauseModal } from '../modals/pause-modal/pause-modal';
import { ShiftTimeAlert } from '../widgets/shift-time-alert/shift-time-alert';
import type { ShiftCycles } from '../../../pages/shift-cycles/shift-cycles';

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
    BalanceModal, StampingBalanceModal, PauseModal, ShiftTimeAlert,
  ],
  templateUrl: './shift-cycles-shell.html',
})
export class ShiftCyclesShell {
  page = input.required<ShiftCycles>();
}
