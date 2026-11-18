import { Component, WritableSignal, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { extractFieldErrorMessage } from '../../../../../common/functions/session-errors';
import { StampingRecordManual } from '../../../../../shared/components/production/widgets/stamping-record-manual/stamping-record-manual';
import { QuantityDurationModal } from '../../../../../shared/components/production/widgets/quantity-duration-modal/quantity-duration-modal';
import { PendingRecordsBar } from '../../../../../shared/components/production/widgets/pending-records-bar/pending-records-bar';
import { DurationScheduleModal, ManualBatchConfirmation } from '../../../../../shared/components/production/widgets/duration-schedule-modal/duration-schedule-modal';
import { Observable, finalize, of } from 'rxjs';
import { ManualBatchSimulation } from '../../../../../models/production/manual-batch-simulation';
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

// Replacement of app-shift-cycles for modules with
// allows_production_time_adjustment=true: inherits ShiftCycles and only
// changes the template. New quantities (production SKUs via
// app-quantity-duration-modal, stamping via app-stamping-record-manual) are
// queued in an in-memory store and saved as one batch with a single manual
// duration confirmed in one modal (see the batch section below). Covers production and stamping.
// Shape of the in-memory manual stores (production and stamping) used by the batch flow.
interface ManualBatchStore {
  records(): any[];
  clear(): void;
  removeAt(index: number): void;
}

@Component({
  selector: 'app-shift-cycles-manual',
  imports: [ShiftCyclesShell, StampingRecordManual, QuantityDurationModal, PendingRecordsBar, DurationScheduleModal],
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

  // AdditionalStampingTime id -> standard_time (minutes per unit, same
  // criterion as app-additional-stamping-time-card) — used by
  // app-duration-schedule-modal (variant 'stamping') to total minutes.
  private additionalStampingTimesList = toSignal(
    // Only the stamping duration modal reads these times; production pages skip the request.
    this.config.showStampingRecord ? this.additionalStampingTimeService.all() : of([]),
    { initialValue: [] },
  );
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

  // A NEW record is queued in ManualProductionRecordsStore (same shape as the
  // POST to production-records/) instead of calling the API; the table shows
  // it right away through pendingRecords and the batch wizard persists it
  // later. Editing an existing record keeps the inherited flow (persists via API).
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

  // "Guardar" in app-pending-records-bar runs the efficiency pre-calculation
  // (nothing is saved) and only then opens the single confirmation modal
  // (app-duration-schedule-modal), which reuses that result. The bar is hidden
  // while the modal (or a quantity capture, qms inherited from ShiftCycles) is open.
  protected scheduleModalVisible = signal(false);
  protected batchHidesBar = computed(() => this.scheduleModalVisible() || this.qms.visible());
  protected batchSaving = signal(false);

  // Header context of the confirmation modal.
  protected moduleLabel = computed(() => this.currentSession()?.current_module?.name ?? '');
  protected referenceLabel = computed(() => {
    const order = this.productionOrder();
    return order ? `${order.reference} ${order.description}`.trim() : '';
  });

  // Simulation callbacks for app-duration-schedule-modal (arrow functions so
  // they keep `this` when invoked by the presentational modal).
  protected simulateProduction = (records: Partial<ProductionRecord>[], seconds: number | null) =>
    this.manualBatchRecordService.simulateManualBatch(records, seconds);

  protected simulateStamping = (records: Partial<StampingRecord>[], seconds: number | null) =>
    this.manualStampingBatchRecordService.simulateManualBatch(records, seconds);

  protected precalcBusy = signal(false);
  protected productionPrecalc = signal<ManualBatchSimulation | null>(null);
  protected stampingPrecalc = signal<ManualBatchSimulation | null>(null);

  private precalculate(
    request$: Observable<ManualBatchSimulation>,
    target: (sim: ManualBatchSimulation) => void,
  ): void {
    if (this.precalcBusy()) return;
    this.precalcBusy.set(true);
    request$.pipe(finalize(() => this.precalcBusy.set(false))).subscribe({
      next: target,
      error: (err: HttpErrorResponse) => this.manualBatchDialogService.openToast(
        'No se pudo calcular la eficiencia',
        extractFieldErrorMessage(err) ?? 'Intenta de nuevo.',
        'fail',
      ),
    });
  }

  // Saves the whole queued batch in one request (all-or-nothing) with the
  // single duration confirmed in the modal. On error the modal stays open and
  // the records are kept, so the time can be adjusted and confirmed again.
  private persistBatch(
    service: { createManualBatch(records: any[], seconds: number): Observable<unknown> },
    store: ManualBatchStore,
    visible: WritableSignal<boolean>,
    schedule: ManualBatchConfirmation,
  ): void {
    const records = store.records();
    if (!records.length || this.batchSaving()) return;

    this.batchSaving.set(true);
    service.createManualBatch(records, schedule.duration_seconds)
      .pipe(finalize(() => this.batchSaving.set(false)))
      .subscribe({
        next: () => {
          store.clear();
          visible.set(false);
          this.refreshAfterSave();
          this.manualBatchDialogService.openToast(
            'Registros guardados',
            `${records.length} registro(s) · horario ${schedule.start_time}-${schedule.end_time}`,
            'check',
          );
        },
        error: (err: HttpErrorResponse) => {
          const message = extractFieldErrorMessage(err) ?? 'Error al guardar los registros.';
          this.manualBatchDialogService.openToast('No se pudo guardar', message, 'fail');
        },
      });
  }

  // Removing a record from the confirmation modal; an empty batch closes it.
  private removePending(store: ManualBatchStore, visible: WritableSignal<boolean>, index: number): void {
    store.removeAt(index);
    if (!store.records().length) visible.set(false);
  }

  protected onSaveAllPending(): void {
    this.precalculate(this.simulateProduction(this.manualRecordsStore.records(), null), sim => {
      this.productionPrecalc.set(sim);
      this.scheduleModalVisible.set(true);
    });
  }

  protected onScheduleCancel(): void {
    this.scheduleModalVisible.set(false);
  }

  // POST /production-records/manual-duration-batch/
  protected onConfirmBatch(schedule: ManualBatchConfirmation): void {
    this.persistBatch(this.manualBatchRecordService, this.manualRecordsStore, this.scheduleModalVisible, schedule);
  }

  protected onRemovePending(index: number): void {
    this.removePending(this.manualRecordsStore, this.scheduleModalVisible, index);
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

  // Same flow as the production one, for the stamping store.
  protected stampingScheduleModalVisible = signal(false);
  protected stampingBatchHidesBar = computed(() =>
    this.stampingScheduleModalVisible() || this.shiftModals.stampingRecordVisible()
  );

  protected onStampingSaveAllPending(): void {
    this.precalculate(this.simulateStamping(this.manualStampingRecordsStore.records(), null), sim => {
      this.stampingPrecalc.set(sim);
      this.stampingScheduleModalVisible.set(true);
    });
  }

  protected onStampingScheduleCancel(): void {
    this.stampingScheduleModalVisible.set(false);
  }

  // POST /stamping-records/manual-duration-batch/
  protected onStampingConfirmBatch(schedule: ManualBatchConfirmation): void {
    this.persistBatch(
      this.manualStampingBatchRecordService, this.manualStampingRecordsStore, this.stampingScheduleModalVisible, schedule,
    );
  }

  protected onRemoveStampingPending(index: number): void {
    this.removePending(this.manualStampingRecordsStore, this.stampingScheduleModalVisible, index);
  }
}
