import { tap } from 'rxjs';
import { computed, inject, Injectable, signal } from '@angular/core';
import { ProductionRecordService } from '../production/production-record-service';
import { WorkSessionActivityService } from '../production/work-session-activity-service';
import { SkuTaskDetail } from '../../models/production/sku-task-detail';
import { ProductionRecord } from '../../models/production/production-record';
import { WorkSession } from '../../models/production/work-session';
import { WorkBreakRecord } from '../../models/production/work-break-record';

@Injectable({ providedIn: 'root' })
export class TaskTimerService {
  private recordService = inject(ProductionRecordService);
  private activityService = inject(WorkSessionActivityService);

  currentSession = signal<WorkSession | null>(null);
  activeActivityId = computed(() => this.currentSession()?.active_activity?.id);
  activeBreak = computed(() => this.currentSession()?.active_activity.active_break);
  totalPauseSeconds = computed(() => this.currentSession()?.active_activity.total_pause_time_seconds?? 0);
  isStarted = signal(false);
  showQuantityModal = signal(false);
  showPauseModal = signal(false);
  currentRecord = signal<ProductionRecord | null>(null);
  isPaused = computed(() => !!this.currentSession()?.active_activity.is_paused);
  availableOperators = computed(()=> this.currentSession()?.employees_snapshot?.length ?? 0);

  setSession(session: WorkSession | null) {
    this.currentSession.set(session);
  }

  start(sku: SkuTaskDetail) {
    const activityId = this.currentSession()?.active_activity?.id;
    return this.recordService.create({
      sku_rowid: sku.skuRowId,
      op_rowid: sku.opRowId,
      op_number: sku.opNumber,
      op_type: sku.opType,
      ordered_quantity: sku.orderedQty,
      planned_quantity: sku.plannedQty,
      completed_quantity: 0,
      scrap_quantity: 0,
      rejected_quantity: 0,
      work_session_activity: activityId,
    });
  }

  confirm(record: ProductionRecord) {
    this.currentRecord.set(record);
    this.isStarted.set(true);
  }

  openPauseModal() { this.showPauseModal.set(true); }
  closePauseModal() { this.showPauseModal.set(false); }
  openQuantityModal() { this.showQuantityModal.set(true); }
  closeQuantityModal() { this.showQuantityModal.set(false); }

  saveQuantity(recordId: number, data: Partial<ProductionRecord>) {
    return this.recordService.patch(recordId, data);
  }

  setPauseState(breakRecord: WorkBreakRecord) {
    const session = this.currentSession();
    if (!session?.active_activity) return;
    this.currentSession.set({
      ...session,
      active_activity: {
        ...session.active_activity,
        is_paused: true,
        active_break: breakRecord,
      },
    });
  }

  setResumeState(closedBreak: WorkBreakRecord) {
    const session = this.currentSession();
    if (!session?.active_activity) return;
    const prev = session.active_activity;
    this.currentSession.set({
      ...session,
      active_activity: {
        ...prev,
        is_paused: false,
        active_break: null,
        total_pause_time_seconds: prev.total_pause_time_seconds + (closedBreak.duration_seconds ?? 0),
      },
    });
  }

  resume() {
    const activityId = this.activeActivityId();
    if (!activityId) return null;
    return this.activityService.resume(activityId).pipe(
      tap((closedBreak: WorkBreakRecord) => this.setResumeState(closedBreak))
    );
  }

  reset() {
    this.isStarted.set(false);
    this.showQuantityModal.set(false);
    this.showPauseModal.set(false);
    this.currentRecord.set(null);
  }
}
