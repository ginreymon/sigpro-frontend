import { Component, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { extractFieldErrorMessage } from '../../../common/functions/session-errors';
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
import { StampingRecordManual } from '../../../shared/components/production/widgets/stamping-record-manual/stamping-record-manual';
import { QuantityDurationModal } from '../../../shared/components/production/widgets/quantity-duration-modal/quantity-duration-modal';
import { PendingRecordsBar } from '../../../shared/components/production/widgets/pending-records-bar/pending-records-bar';
import { DurationScheduleModal } from '../../../shared/components/production/widgets/duration-schedule-modal/duration-schedule-modal';
import { PendingRecordsReviewModal } from '../../../shared/components/production/widgets/pending-records-review-modal/pending-records-review-modal';
import { InfoCardTemplate } from '../../../template/info-card-template/info-card-template';
import { ShiftCyclesFab } from '../../../shared/components/production/widgets/shift-cycles-fab/shift-cycles-fab';
import { TableTemplate } from '../../../directives/table-template';
import { finalize } from 'rxjs';
import { ShiftCycles } from '../shift-cycles/shift-cycles';
import { ProductionRecord } from '../../../models/production/production-record';
import { ManualProductionRecordsStore } from '../../../services/production/manual-production-records-store';
import { ProductionRecordService } from '../../../services/production/production-record-service';
import { DialogService } from '../../../services/common/dialog-service';

// Reemplazo de app-shift-cycles para módulos con
// allows_production_time_adjustment=true (Module.allows_production_time_adjustment):
// misma lógica (hereda ShiftCycles tal cual), solo cambia el template — al
// seleccionar un SKU se abre app-quantity-duration-modal (mismo template y
// validaciones que app-quantity-modal, ver quantity-duration-modal.ts) en
// vez de app-quantity-modal. El registro de estampación manual con horario
// propio aún no existe como widget (app-stamping-record no tiene esa
// pestaña) — hasta que se defina ese flujo, esta página no cubre módulos de
// estampación con el flag activo.
@Component({
  selector: 'app-shift-cycles-manual',
  imports: [
    WorkSpaceLayout, FormsModule, OrderSearcher, ProductionOrdersTable, UiButton, UiIcon, WorkShiftSummary,
    StampingShiftSummary, EmployeesModal, BalanceModal, StampingBalanceModal, PauseModal, OrderHeader,
    RecentRecordsCard, ShiftTimeAlert, StampingRecordManual, QuantityDurationModal, PendingRecordsBar, DurationScheduleModal,
    PendingRecordsReviewModal, InfoCardTemplate, ShiftCyclesFab, TableTemplate,
  ],
  templateUrl: './shift-cycles-manual.html',
  styleUrl: './shift-cycles-manual.css',
})
export class ShiftCyclesManual extends ShiftCycles {
  protected manualRecordsStore = inject(ManualProductionRecordsStore);
  private manualBatchRecordService = inject(ProductionRecordService);
  private manualBatchDialogService = inject(DialogService);

  // Registros manuales pendientes (aún no persistidos) de la orden que está
  // abierta ahora mismo — app-production-orders-table los suma encima de
  // productionOrder para reflejar en el navegador lo recién "guardado".
  protected pendingRecords = computed(() => {
    const order = this.productionOrder();
    if (!order) return [];
    return this.manualRecordsStore.records().filter(
      (r) => r.op_type === order.documentType && r.op_number === order.documentNumber
    );
  });

  constructor() {
    super();
    // El registro aquí no depende de ventana horaria: app-shift-hourly-record
    // no se usa en este template (S_H_WINDOW/S_H_KEEP_OPEN eran suyos), y
    // forzar showHourlyRecord=true deja en no-op el watch privado de
    // ShiftCycles que aplicaría STAMPING_CAL_WINDOW para módulos de
    // estampación — inWindow se queda en su valor inicial (true) siempre.
    this.config = { ...this.config, showHourlyRecord: true };
  }

  // app-quantity-duration-modal ya dispara su propia alerta placeholder al
  // guardar (ver quantity-duration-modal.ts) y sigue emitiendo onSave con el
  // payload normal. Para un registro NUEVO de este flujo manual, el guardado
  // real (persistir vía API) todavía no está definido, así que en vez de
  // llamar a un servicio/endpoint se guarda en ManualProductionRecordsStore
  // (mismo shape que el POST a production-records/) y la tabla se actualiza
  // sola en el navegador (pendingRecords). Editar un registro existente
  // sigue el flujo heredado normal (sí persiste vía API).
  override saveSKU(record: Partial<ProductionRecord>): void {
    if (record.id) {
      super.saveSKU(record);
      return;
    }

    const activityId = this.currentSession()?.active_activity?.id;
    if (!activityId) return;

    this.manualRecordsStore.add({ ...record, work_session_activity: activityId });
    this.qms.close();
  }

  // Asistente de guardado por lote que sale al pulsar Guardar en
  // app-pending-records-bar: horario (duration-schedule-modal) → revisión
  // en tabla (pending-records-review-modal) → confirmar. app-pending-records-bar
  // se oculta (forceHidden) mientras cualquiera de los dos esté abierto, o
  // mientras app-quantity-duration-modal (qms, heredado de ShiftCycles) esté
  // capturando cantidades — ambos flotan en el mismo borde inferior.
  protected scheduleModalVisible = signal(false);
  protected reviewModalVisible = signal(false);
  protected batchHidesBar = computed(() => this.scheduleModalVisible() || this.reviewModalVisible() || this.qms.visible());

  // Expuesto (no private) para que pending-records-review-modal muestre el
  // horario capturado junto al total de unidades.
  protected pendingSchedule = signal<{ start_time: string; end_time: string; duration_seconds: number } | null>(null);

  protected onSaveAllPending(): void {
    this.scheduleModalVisible.set(true);
  }

  protected onScheduleCancel(): void {
    this.scheduleModalVisible.set(false);
  }

  protected onScheduleNext(schedule: { start_time: string; end_time: string; duration_seconds: number }): void {
    this.pendingSchedule.set(schedule);
    this.scheduleModalVisible.set(false);
    this.reviewModalVisible.set(true);
  }

  protected onReviewCancel(): void {
    this.reviewModalVisible.set(false);
    this.pendingSchedule.set(null);
  }

  // Persiste el lote completo vía POST /production-records/manual-duration-batch/:
  // un solo duration_seconds (horario capturado en el paso anterior) cubre
  // todos los registros pendientes del store, que se crean todo-o-nada.
  protected onReviewConfirm(): void {
    const records = this.manualRecordsStore.records();
    const schedule = this.pendingSchedule();
    if (!records.length || !schedule) return;

    this.loaderService.showLoader();
    this.manualBatchRecordService.createManualBatch(records, schedule.duration_seconds)
      .pipe(finalize(() => this.loaderService.hideLoader()))
      .subscribe({
        next: () => {
          this.manualRecordsStore.clear();
          this.reviewModalVisible.set(false);
          this.pendingSchedule.set(null);
          this.reloadOrder();
          this.manualBatchDialogService.openToast(
            'Registros guardados',
            `${records.length} registro(s) · horario ${schedule.start_time}-${schedule.end_time}`,
            'check',
          );
        },
        error: (err: HttpErrorResponse) => {
          // No se limpia manualRecordsStore (los registros pendientes se
          // conservan para reintentar) y se vuelve al estado de selección
          // (review modal cerrado) para que app-pending-records-bar
          // reaparezca en vez de quedar oculta tras el modal fallido.
          this.reviewModalVisible.set(false);
          this.pendingSchedule.set(null);
          const message = extractFieldErrorMessage(err) ?? 'Error al guardar los registros.';
          this.manualBatchDialogService.openToast('No se pudo guardar', message, 'fail');
        },
      });
  }
}
