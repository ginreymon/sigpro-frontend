import { computed, inject, Injectable, signal } from '@angular/core';
import { ProductionRecordService } from '../production/production-record-service';
import { SkuTaskDetail } from '../../models/production/sku-task-detail';
import { ProductionRecord } from '../../models/production/production-record';
import { WorkSession } from '../../models/production/work-session';

@Injectable({ providedIn: 'root' })
export class TaskTimerService {
  private recordService = inject(ProductionRecordService);

  currentSession = signal<WorkSession | null>(null);
  activeActivityId = computed(() => this.currentSession()?.active_activity?.id);
  activeBreak = computed(() => this.currentSession()?.active_activity.active_break);
  isStarted = signal(false);
  showQuantityModal = signal(false);
  showPauseModal = signal(false);
  currentRecord = signal<ProductionRecord | null>(null);

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

  reset() {
    this.isStarted.set(false);
    this.showQuantityModal.set(false);
    this.showPauseModal.set(false);
    this.currentRecord.set(null);
  }
}
