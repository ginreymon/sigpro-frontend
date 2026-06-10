import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { environment } from '../../../../environments/environment.development';
import { ProductionOrdersTable } from '../../../shared/elements/production-orders-table/production-orders-table';
import { WorkSpaceLayout } from '../../../layouts/work-space-layout/work-space-layout';
import { finalize } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { OrderSearcher } from '../../../shared/components/order-searcher/order-searcher';
import { ProductionOrder } from '../../../models/production/production-order';
import { UiButton } from '../../../shared/elements/ui-button/ui-button';
import { UiIcon } from '../../../shared/elements/ui-icon/ui-icon';
import { OrderHeader } from '../../../shared/elements/order-header/order-header';
import { WorkShiftSummary } from '../../../shared/components/work-shift-summary/work-shift-summary';
import { EmployeesModal } from '../../../shared/components/employees-modal/employees-modal';
import { BalanceBottomSheet } from '../../../shared/components/balance-bottom-sheet/balance-bottom-sheet';
import { SkuTaskDetail } from '../../../models/production/sku-task-detail';
import { DialogService } from '../../../services/common/dialog-service';
import { ProductionRecord } from '../../../models/production/production-record';
import { WorkSession } from '../../../models/production/work-session';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { WorkSessionService } from '../../../services/production/work-session-service';
import { LastRecordCard } from '../../../shared/components/last-record-card/last-record-card';
import { ShiftTimeAlert } from '../../../shared/components/shift-time-alert/shift-time-alert';
import { QuantityModal } from '../../../shared/components/quantity-modal/quantity-modal';
import { QuantityModalService } from '../../../services/common/quantity-modal-service';
import { UnplannedShiftMessage } from '../../../layouts/messages/unplanned-shift-message/unplanned-shift-message';
import { FinalizeShiftMessage } from '../../../shared/components/finalize-shift-message/finalize-shift-message';
import { ProductionRecordService } from '../../../services/production/production-record-service';
import { WorkBreakRecord } from '../../../models/production/work-break-record';
import { ShiftHourlyRecord } from '../../../shared/components/shift-hourly-record/shift-hourly-record';
import { ProductionContext } from '../../../models/production/production-context';
import { BaseProductionOrderPage } from '../../../common/classes/base-production-order-page';
import { ShiftCyclesActions } from "../../../shared/components/shift-cycles-actions/shift-cycles-actions";
import { PauseModal } from '../../../shared/components/pause-modal/pause-modal';
import { ShiftModalsService } from '../../../services/common/shift-modals-service';
import { ProductionRecordContext } from '../../../models/production/production-record-context';

@Component({
  selector: 'app-shift-cycles',
  imports: [WorkSpaceLayout, FormsModule, OrderSearcher, ProductionOrdersTable, UiButton, UiIcon, WorkShiftSummary, EmployeesModal, BalanceBottomSheet, PauseModal, OrderHeader, LastRecordCard, ShiftTimeAlert, ShiftHourlyRecord, QuantityModal, UnplannedShiftMessage, FinalizeShiftMessage, ShiftCyclesActions],
  templateUrl: './shift-cycles.html',
  styleUrl: './shift-cycles.css',
})
export class ShiftCycles extends BaseProductionOrderPage {
  protected inWindow = signal(true);

  private DAY_OPERATION_URL = environment.DAY_OPERATION_URL;
  private OPERATION_ORDER_URL = environment.SHIFT_CYCLES_URL;

  private dialogService = inject(DialogService);
  private workSessionService = inject(WorkSessionService);
  private qms = inject(QuantityModalService);
  private productionRecordService = inject(ProductionRecordService);
  private destroyRef = inject(DestroyRef);
  protected shiftModals = inject(ShiftModalsService);

  private hasCheckedActiveRecord = false;
  private activeRecord: ProductionRecord | null = null;

  private readonly ALLOWED_COST_CENTERS = [110, 103];
  private context = toSignal(this.contextService.context$, { initialValue: null });

  lastRecordTrigger = signal(0);
  selectedSKU = signal<SkuTaskDetail | null>(null);
  contextDocTypes = computed(() => this.context()?.docTypes ?? []);
  contextEmployees = computed(() =>
    (this.context()?.employees ?? []).filter(e => this.ALLOWED_COST_CENTERS.includes(e.cost_center_rowid!))
  );

  get document() {
    const doc = this.productionOrder();
    if (!doc) return '';
    return `${doc.documentType} ${doc.documentNumber}`;
  }

  protected finalizeDay = computed(() => !!this.currentSession()?.editing_finalized);

  protected preselectedIds = computed(() =>
    this.currentSession()?.employees_snapshot?.map(e => e.id) ?? []
  );

  override ngOnInit(): void {
    super.ngOnInit();
    this.shiftModals.employeesSaved$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(ids => this.updateEmployees(ids));
  }

  protected override beforeLoad(): void {
    this.hasCheckedActiveRecord = false;
    this.activeRecord = null;
  }

  protected override onContextLoaded(context: ProductionContext): void {
    this.checkActiveRecord(context.session, context.order);
    if (!context.order) this.lastRecordTrigger.update(n => n + 1);
  }

  protected override onContextError(): void {
    this.router.navigateByUrl(this.DAY_OPERATION_URL);
  }

  goToSearch() {
    this.productionOrder.set(null);
    this.router.navigateByUrl(this.OPERATION_ORDER_URL);
  }

  goToDayOperation() {
    this.router.navigateByUrl(this.DAY_OPERATION_URL);
  }

  openTaskDialog(sku: SkuTaskDetail) {
    if (this.activeRecord?.sku_rowid === sku.skuRowId) {
      this.reloadOrder();
      return;
    }
    if (this.hasCheckedActiveRecord && this.activeRecord) {
      this.showActiveRecordToast();
      return;
    }
    this.selectedSKU.set(sku);
    this.qms.open();
  }

  private checkActiveRecord(session: WorkSession | null, order: ProductionOrder | null) {
    if (this.hasCheckedActiveRecord) return;
    if (!session || !order) return;
    this.hasCheckedActiveRecord = true;
    const record = session.active_activity?.last_open_production_record;
    if (!record) return;
    this.activeRecord = record;
    if (!(record.op_number === order.documentNumber && record.op_type === order.documentType)) {
      this.showActiveRecordToast();
    }
  }

  openEmployeesSnapshot(): void {
    this.shiftModals.openEmployees({
      employees: this.contextEmployees(),
      preselectedIds: this.preselectedIds(),
    });
  }

  updateEmployees(ids: number[]) {
    const sessionId = this.currentSession()?.id;
    if (!sessionId) return;
    this.loaderService.showLoader();
    this.workSessionService.rotateActivity(sessionId, ids)
      .pipe(finalize(() => this.loaderService.hideLoader()))
      .subscribe({
        next: () => this.refreshSession(),
        error: (err) => {
          const messages: string[] = Array.isArray(err?.error)
            ? err.error.map((m: string) => m.replace('is already assigned to module', 'ya está asignado al módulo'))
            : ['Error al actualizar empleados.'];
          this.dialogService.openToast('No se pudo actualizar', messages.join(' · '), 'fail');
        },
      });
  }

  saveSKU(record: Partial<ProductionRecord>) {
    if (record.id) {
      this.updateRecord(record);
      return;
    }

    const activityId = this.currentSession()?.active_activity?.id;
    if (!activityId) return;

    const payload: Partial<ProductionRecord> = { ...record, work_session_activity: activityId };

    this.loaderService.showLoader();
    this.productionRecordService.create(payload)
      .pipe(finalize(() => this.loaderService.hideLoader()))
      .subscribe({
        next: () => {
          this.shiftModals.openShiftHourlyRecord();
          this.qms.close();
          this.reloadOrder();
          const parts: string[] = [];
          if (payload.completed_quantity) parts.push(`Completadas: ${payload.completed_quantity}`);
          if (payload.rejected_quantity) parts.push(`Saldos: ${payload.rejected_quantity}`);
          if (payload.scrap_quantity) parts.push(`Bajas: ${payload.scrap_quantity}`);
          this.dialogService.openToast('Cantidades guardadas', parts.join(' · '), 'check');
        },
        error: () => {        
          this.dialogService.openToast('No se pudo guardar', 'Error al guardar el registro.', 'fail');
        },
      });
  }

  private updateRecord(record: Partial<ProductionRecord>): void {
    const id = record.id!;
    const payload = {
      completed_quantity: record.completed_quantity,
      rejected_quantity: record.rejected_quantity,
      scrap_quantity: record.scrap_quantity,
    };

    this.loaderService.showLoader();
    this.productionRecordService.patch(id, payload)
      .pipe(finalize(() => this.loaderService.hideLoader()))
      .subscribe({
        next: () => {         
          this.reloadOrder();
          this.shiftModals.reloadBalance();
          this.qms.close();
          const parts: string[] = [];
          parts.push(`Completadas: ${payload.completed_quantity}`);
          parts.push(`Saldos: ${payload.rejected_quantity}`);
          parts.push(`Bajas: ${payload.scrap_quantity}`);
          this.dialogService.openToast('Registro actualizado', parts.join(' · '), 'check');
        },
        error: () => {
          this.dialogService.openToast('No se pudo actualizar', 'Error al guardar el registro.', 'fail');
        },
      });
  }

  handleEditRecord({ sku, record }: { sku: SkuTaskDetail; record: ProductionRecordContext }): void {
    this.selectedSKU.set(sku);
    this.qms.openForEdit(record);
  }

  refreshSession() {
    this.loaderService.showLoader();
    this.workSessionService.getActive()
      .pipe(finalize(() => this.loaderService.hideLoader()))
      .subscribe({
        next: (session: WorkSession) => {
          this.currentSession.set(session);
          this.contextService.updateSession(session);
        },
      });
  }

  private showActiveRecordToast() {
    if (!this.activeRecord) return;
    this.dialogService.openToast(
      'Orden sin finalizar',
      `Hay una tarea activa en ${this.activeRecord.op_type} ${this.activeRecord.op_number}`,
      'fail'
    );
  }  

  onPauseSaved(record: WorkBreakRecord) {  
    this.refreshSession();
    this.dialogService.openToast('Pausa registrada', record.name ?? record.custom_reason ?? '', 'check');
  }

  closeSession() {
    this.loaderService.showLoader();
    this.workSessionService
      .closeSession(this.currentSession()?.id!)
      .pipe(finalize(() => this.loaderService.hideLoader()))
      .subscribe({
        next: () => {
          this.currentSession.set(null);
          this.router.navigateByUrl('/');
        },
      });
  }
}
