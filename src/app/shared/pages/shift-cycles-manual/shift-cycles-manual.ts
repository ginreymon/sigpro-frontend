import { Component } from '@angular/core';
import { WorkSpaceLayout } from '../../../layouts/work-space-layout/work-space-layout';
import { FormsModule } from '@angular/forms';
import { OrderSearcher } from '../../../shared/components/production/widgets/order-searcher/order-searcher';
import { ProductionOrdersTable } from '../../../shared/components/production/tables/production-orders-table/production-orders-table';
import { UiButton } from '../../../shared/elements/ui-button/ui-button';
import { UiIcon } from '../../../shared/elements/ui-icon/ui-icon';
import { OrderHeader } from '../../../shared/components/production/cards/order-header/order-header';
import { WorkShiftSummary } from '../../../shared/components/production/cards/work-shift-summary/work-shift-summary';
import { StampingShiftSummary } from '../../../shared/components/production/cards/stamping-shift-summary/stamping-shift-summary';
import { EmployeesModal } from '../../../shared/components/production/modals/employees-modal/employees-modal';
import { BalanceModal } from '../../../shared/components/production/modals/balance-modal/balance-modal';
import { StampingBalanceModal } from '../../../shared/components/production/modals/stamping-balance-modal/stamping-balance-modal';
import { PauseModal } from '../../../shared/components/production/modals/pause-modal/pause-modal';
import { RecentRecordsCard } from '../../../shared/components/production/cards/recent-records-card/recent-records-card';
import { ShiftTimeAlert } from '../../../shared/components/production/widgets/shift-time-alert/shift-time-alert';
import { ShiftHourlyRecord } from '../../../shared/components/production/widgets/shift-hourly-record/shift-hourly-record';
import { StampingRecord } from '../../../shared/components/production/widgets/stamping-record/stamping-record';
import { QuantityDurationModal } from '../../../shared/components/production/widgets/quantity-duration-modal/quantity-duration-modal';
import { InfoCardTemplate } from '../../../template/info-card-template/info-card-template';
import { ShiftCyclesFab } from '../../../shared/components/production/widgets/shift-cycles-fab/shift-cycles-fab';
import { TableTemplate } from '../../../directives/table-template';
import { ShiftCycles } from '../shift-cycles/shift-cycles';

// Reemplazo de app-shift-cycles para módulos con
// allows_manual_duration_entry=true (Module.allows_manual_duration_entry):
// misma lógica (hereda ShiftCycles tal cual), solo cambia el template —
// aquí el registro de cantidades en producción siempre pasa por
// app-quantity-duration-modal (pestaña Horario obligatoria antes de
// Cantidades). El registro de estampación manual con horario propio aún
// no existe como widget (app-stamping-record no tiene esa pestaña) — hasta
// que se defina ese flujo, esta página no cubre módulos de estampación con
// el flag activo.
@Component({
  selector: 'app-shift-cycles-manual',
  imports: [
    WorkSpaceLayout, FormsModule, OrderSearcher, ProductionOrdersTable, UiButton, UiIcon, WorkShiftSummary,
    StampingShiftSummary, EmployeesModal, BalanceModal, StampingBalanceModal, PauseModal, OrderHeader,
    RecentRecordsCard, ShiftTimeAlert, ShiftHourlyRecord, StampingRecord, QuantityDurationModal,
    InfoCardTemplate, ShiftCyclesFab, TableTemplate,
  ],
  templateUrl: './shift-cycles-manual.html',
  styleUrl: './shift-cycles-manual.css',
})
export class ShiftCyclesManual extends ShiftCycles { }
