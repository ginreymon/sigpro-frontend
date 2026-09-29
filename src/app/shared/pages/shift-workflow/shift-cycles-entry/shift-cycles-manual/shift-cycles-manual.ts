import { Component, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { extractFieldErrorMessage } from '../../../../../common/functions/session-errors';
import { StampingRecordManual } from '../../../../../shared/components/production/widgets/stamping-record-manual/stamping-record-manual';
import { QuantityDurationModal } from '../../../../../shared/components/production/widgets/quantity-duration-modal/quantity-duration-modal';
import { PendingRecordsBar } from '../../../../../shared/components/production/widgets/pending-records-bar/pending-records-bar';
import { DurationScheduleModal } from '../../../../../shared/components/production/widgets/duration-schedule-modal/duration-schedule-modal';
import { PendingRecordsReviewModal } from '../../../../../shared/components/production/widgets/pending-records-review-modal/pending-records-review-modal';
import { finalize } from 'rxjs';
import { ShiftCycles } from '../shift-cycles/shift-cycles';
import { ProductionRecord } from '../../../../../models/production/production-record';
import { ManualProductionRecordsStore } from '../../../../../services/production/manual-production-records-store';
import { ProductionRecordService } from '../../../../../services/production/production-record-service';
import { DialogService } from '../../../../../services/common/dialog-service';
import { StampingRecord } from '../../../../../models/stamping/stamping-record';
import { ManualStampingRecordsStore } from '../../../../../services/stamping/manual-stamping-records-store';
import { AdditionalStampingTimeService } from '../../../../../services/stamping/additional-stamping-time-service';
import { StampingRecordService } from '../../../../../services/stamping/stamping-record-service';
import { toSignal } from '@angular/core/rxjs-interop';
import { ShiftCyclesShell } from '../shift-cycles-shell/shift-cycles-shell';
import { ShiftCycleActionKey } from '../../../../../shared/components/production/widgets/shift-cycles-fab/shift-cycles-fab';

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
    ShiftCyclesShell, StampingRecordManual, QuantityDurationModal, PendingRecordsBar, DurationScheduleModal,
    PendingRecordsReviewModal,
  ],
  templateUrl: './shift-cycles-manual.html',
  styleUrl: './shift-cycles-manual.css',
})
export class ShiftCyclesManual extends ShiftCycles {
  protected manualRecordsStore = inject(ManualProductionRecordsStore);
  private manualBatchRecordService = inject(ProductionRecordService);
  private manualBatchDialogService = inject(DialogService);
  protected manualStampingRecordsStore = inject(ManualStampingRecordsStore);
  private additionalStampingTimeService = inject(AdditionalStampingTimeService);
  private manualStampingBatchRecordService = inject(StampingRecordService);

  // id de AdditionalStampingTime -> standard_time (minutos por unidad, mismo
  // criterio que app-additional-stamping-time-card) — usado por
  // app-pending-records-review-modal (variant 'stamping') para totalizar
  // minutos en vez de solo contar tiempos seleccionados.
  private additionalStampingTimesList = toSignal(this.additionalStampingTimeService.all(), { initialValue: [] });
  protected additionalTimeMinutes = computed<Record<number, number>>(() =>
    Object.fromEntries(this.additionalStampingTimesList().map((t) => [t.id, Number(t.standard_time) || 0]))
  );

  // Registros manuales pendientes (aún no persistidos) de la orden que está
  // abierta ahora mismo — app-production-orders-table los suma encima de
  // productionOrder para reflejar en el navegador lo recién "guardado".
  override pendingRecords = computed<Partial<ProductionRecord>[]>(() => {
    const order = this.productionOrder();
    if (!order) return [];
    return this.manualRecordsStore.records().filter(
      (r) => r.op_type === order.documentType && r.op_number === order.documentNumber
    );
  });

  // Extension points de app-shift-cycles-shell (ver ShiftCycles): esta
  // variante oculta pausa/último-envío en el fab, siempre muestra la
  // action-bar en 'justify-between' (no depende de shift-hourly-record, que
  // aquí no se usa) y da position:relative al contenedor principal para que
  // app-pending-records-bar (position:absolute) se ancle a él.
  override fabHiddenActions: ShiftCycleActionKey[] = ['pause', 'lastDelivery'];
  override fabVisible = computed(() => this.stampingChecksPassed());
  override actionBarJustifyClass = computed(() => 'justify-between');
  override contentExtraClass = 'relative';

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

  // Espejo de saveSKU pero para el flujo de estampación
  // (app-stamping-record-manual): en vez de persistir de una vía
  // stampingRecordService.create() (comportamiento heredado de ShiftCycles),
  // se acumula en ManualStampingRecordsStore hasta que se defina el guardado
  // por lote (igual que production-records/manual-duration-batch/).
  override saveStamping(record: Partial<StampingRecord>): void {
    if (record.id) {
      super.saveStamping(record);
      return;
    }

    const activityId = this.currentSession()?.active_activity?.id;
    if (!activityId) return;

    this.manualStampingRecordsStore.add({ ...record, work_session_activity: activityId });
    this.shiftModals.closeStampingRecord();
  }

  // Mismo asistente de guardado por lote que scheduleModalVisible/
  // reviewModalVisible (producción), para el store de estampación.
  // app-pending-records-bar se oculta mientras cualquiera de los dos esté
  // abierto, o mientras app-stamping-record-manual esté capturando un
  // registro nuevo.
  protected stampingScheduleModalVisible = signal(false);
  protected stampingReviewModalVisible = signal(false);
  protected stampingBatchHidesBar = computed(() =>
    this.stampingScheduleModalVisible() || this.stampingReviewModalVisible() || this.shiftModals.stampingRecordVisible()
  );

  protected stampingPendingSchedule = signal<{ start_time: string; end_time: string; duration_seconds: number } | null>(null);

  protected onStampingSaveAllPending(): void {
    this.stampingScheduleModalVisible.set(true);
  }

  protected onStampingScheduleCancel(): void {
    this.stampingScheduleModalVisible.set(false);
  }

  protected onStampingScheduleNext(schedule: { start_time: string; end_time: string; duration_seconds: number }): void {
    this.stampingPendingSchedule.set(schedule);
    this.stampingScheduleModalVisible.set(false);
    this.stampingReviewModalVisible.set(true);
  }

  protected onStampingReviewCancel(): void {
    this.stampingReviewModalVisible.set(false);
    this.stampingPendingSchedule.set(null);
  }

  // Persiste el lote completo vía POST /stamping-records/manual-duration-batch/,
  // homólogo a onReviewConfirm (producción): un solo duration_seconds
  // (horario capturado en el paso anterior) cubre todos los registros
  // pendientes del store de estampación, que se crean todo-o-nada.
  protected onStampingReviewConfirm(): void {
    const records = this.manualStampingRecordsStore.records();
    const schedule = this.stampingPendingSchedule();
    if (!records.length || !schedule) return;

    this.loaderService.showLoader();
    this.manualStampingBatchRecordService.createManualBatch(records, schedule.duration_seconds)
      .pipe(finalize(() => this.loaderService.hideLoader()))
      .subscribe({
        next: () => {
          this.manualStampingRecordsStore.clear();
          this.stampingReviewModalVisible.set(false);
          this.stampingPendingSchedule.set(null);
          this.reloadOrder();
          this.manualBatchDialogService.openToast(
            'Registros guardados',
            `${records.length} registro(s) · horario ${schedule.start_time}-${schedule.end_time}`,
            'check',
          );
        },
        error: (err: HttpErrorResponse) => {
          // Igual que onReviewConfirm: no se limpia el store (los registros
          // pendientes se conservan para reintentar) y se vuelve al estado
          // de selección (review modal cerrado) para que app-pending-records-bar
          // reaparezca en vez de quedar oculta tras el modal fallido.
          this.stampingReviewModalVisible.set(false);
          this.stampingPendingSchedule.set(null);
          const message = extractFieldErrorMessage(err) ?? 'Error al guardar los registros.';
          this.manualBatchDialogService.openToast('No se pudo guardar', message, 'fail');
        },
      });
  }
}
