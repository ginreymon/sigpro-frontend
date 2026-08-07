import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { ProductionOrdersTable } from '../../../shared/components/production/tables/production-orders-table/production-orders-table';
import { WorkSpaceLayout } from '../../../layouts/work-space-layout/work-space-layout';
import { finalize, interval } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { OrderSearcher } from '../../../shared/components/production/widgets/order-searcher/order-searcher';
import { ProductionOrder } from '../../../models/production/production-order';
import { UiButton } from '../../../shared/elements/ui-button/ui-button';
import { UiIcon } from '../../../shared/elements/ui-icon/ui-icon';
import { OrderHeader } from '../../../shared/components/production/cards/order-header/order-header';
import { WorkShiftSummary } from '../../../shared/components/production/cards/work-shift-summary/work-shift-summary';
import { StampingShiftSummary } from '../../../shared/components/production/cards/stamping-shift-summary/stamping-shift-summary';
import { EmployeesModal } from '../../../shared/components/production/modals/employees-modal/employees-modal';
import { BalanceModal } from '../../../shared/components/production/modals/balance-modal/balance-modal';
import { StampingBalanceModal } from '../../../shared/components/production/modals/stamping-balance-modal/stamping-balance-modal';
import { SkuTaskDetail } from '../../../models/production/sku-task-detail';
import { DialogService } from '../../../services/common/dialog-service';
import { ProductionRecord } from '../../../models/production/production-record';
import { WorkSession } from '../../../models/production/work-session';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { WorkSessionService } from '../../../services/production/work-session-service';
import { RecentRecordsCard, RecentRecordsService } from '../../../shared/components/production/cards/recent-records-card/recent-records-card';
import { ShiftTimeAlert } from '../../../shared/components/production/widgets/shift-time-alert/shift-time-alert';
import { QuantityModal } from '../../../shared/components/production/modals/quantity-modal/quantity-modal';
import { QuantityModalService } from '../../../services/common/quantity-modal-service';
import { InfoCardTemplate } from '../../../template/info-card-template/info-card-template';
import { ProductionRecordService } from '../../../services/production/production-record-service';
import { WorkBreakRecord } from '../../../models/production/work-break-record';
import { ShiftHourlyRecord } from '../../../shared/components/production/widgets/shift-hourly-record/shift-hourly-record';
import { StampingRecord } from '../../../shared/components/production/widgets/stamping-record/stamping-record';
import { StampingRecord as StampingRecordModel } from '../../../models/stamping/stamping-record';
import { StampingRecordService } from '../../../services/stamping/stamping-record-service';
import { ProductionContext } from '../../../models/production/production-context';
import { BaseProductionOrderPage } from '../../../common/classes/base-production-order-page';
import { parseSessionErrors } from '../../../common/functions/session-errors';
import { EmployeesSavedData } from '../../../services/common/shift-modals-service';
import { ShiftCyclesFab } from "../../../shared/components/production/widgets/shift-cycles-fab/shift-cycles-fab";
import { PauseModal } from '../../../shared/components/production/modals/pause-modal/pause-modal';
import { ShiftModalsService } from '../../../services/common/shift-modals-service';
import { ProductionRecordContext } from '../../../models/production/production-record-context';
import { ShiftNavigationService } from '../../../services/core/shift-navigation-service';
import { RouteContextService } from '../../../services/core/route-context-service';
import { ShiftCyclesConfig } from '../../../common/interfaces/shift-cycles-config';
import { SHIFT_CYCLES_CONFIG } from '../../../common/const/shift-cycles-config';
import { AppConfigService } from '../../../services/core/app-config-service';
import { isWithinHourlyWindow } from '../../../common/functions/hourly-window';

@Component({
  selector: 'app-shift-cycles',
  imports: [WorkSpaceLayout, FormsModule, OrderSearcher, ProductionOrdersTable, UiButton, UiIcon, WorkShiftSummary, StampingShiftSummary, EmployeesModal, BalanceModal, StampingBalanceModal, PauseModal, OrderHeader, RecentRecordsCard, ShiftTimeAlert, ShiftHourlyRecord, StampingRecord, QuantityModal, InfoCardTemplate, ShiftCyclesFab],
  templateUrl: './shift-cycles.html',
  styleUrl: './shift-cycles.css',
})
export class ShiftCycles extends BaseProductionOrderPage {
  protected inWindow = signal(true);

  private shiftNav = inject(ShiftNavigationService);
  private routeContextService = inject(RouteContextService);

  protected config: ShiftCyclesConfig =
    SHIFT_CYCLES_CONFIG[this.routeContextService.currentModule?.url ?? ''] ?? SHIFT_CYCLES_CONFIG['production'];

  private dialogService = inject(DialogService);
  private workSessionService = inject(WorkSessionService);
  protected qms = inject(QuantityModalService);
  private appConfig = inject(AppConfigService);
  private productionRecordService = inject(ProductionRecordService);
  private stampingRecordService = inject(StampingRecordService);
  protected recentRecordsService: RecentRecordsService | null =
    this.config.showStampingRecord ? this.stampingRecordService : null;
  private destroyRef = inject(DestroyRef);
  protected shiftModals = inject(ShiftModalsService);

  private hasCheckedActiveRecord = false;
  private activeRecord: ProductionRecord | null = null;

  private context = toSignal(this.contextService.context$, { initialValue: null });

  lastRecordTrigger = signal(0);
  selectedSKU = signal<SkuTaskDetail | null>(null);
  contextDocTypes = computed(() => this.context()?.docTypes ?? []);

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
    this.loaderService.showLoader();
    this.appConfig.load().subscribe(() => {
      super.ngOnInit();
      this.startStampingWindowWatch();
    });
    this.shiftModals.employeesSaved$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(data => this.updateEmployees(data));
    this.shiftModals.pauseSaved$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(record => this.onPauseSaved(record));
  }

  protected override beforeLoad(): void {
    this.hasCheckedActiveRecord = false;
    this.activeRecord = null;
  }

  // app-shift-hourly-record (showHourlyRecord) es quien alimenta `inWindow` en producción.
  // En estampación ese widget está deshabilitado por config, así que aquí se calcula
  // directamente con la misma ventana horaria, usando la calibración propia de estampación.
  private startStampingWindowWatch(): void {
    if (this.config.showHourlyRecord) return;

    const refresh = () => this.inWindow.set(isWithinHourlyWindow(this.appConfig.stampingCalibrationWindowSeconds));
    refresh();

    interval(1000).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(refresh);
  }

  protected override onContextLoaded(context: ProductionContext): void {
    this.checkActiveRecord(context.session, context.order);
    if (!context.order) this.lastRecordTrigger.update(n => n + 1);
  }

  protected override onContextError(): void {
    this.shiftNav.goToDayOperation();
  }

  goToSearch() {
    this.productionOrder.set(null);
    this.shiftNav.goToShiftCycles();
  }

  goToDayOperation() {
    this.shiftNav.goToDayOperation();
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

  updateEmployees(data: EmployeesSavedData) {
    const sessionId = this.currentSession()?.id;
    if (!sessionId) return;
    const headcount = data.ids.length;
    const weighted = headcount - data.apprenticeIds.length * 0.5;
    this.loaderService.showLoader();
    this.workSessionService.rotateActivity(sessionId, data.ids, data.apprenticeIds)
      .pipe(finalize(() => this.loaderService.hideLoader()))
      .subscribe({
        next: () => {
          this.refreshSession();
          this.dialogService.openToast(
            'Empleados actualizados',
            `Encomendados: ${headcount} · Ponderado: ${weighted}`,
            'check',
          );
        },
        error: (err) => {
          const messages = parseSessionErrors(err, 'Error al actualizar empleados.');
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

  saveStamping(record: Partial<StampingRecordModel>) {
    const activityId = this.currentSession()?.active_activity?.id;
    if (!activityId) return;

    const payload: Partial<StampingRecordModel> = { ...record, work_session_activity: activityId };

    this.loaderService.showLoader();
    this.stampingRecordService.create(payload)
      .pipe(finalize(() => this.loaderService.hideLoader()))
      .subscribe({
        next: () => {
          this.shiftModals.closeStampingRecord();
          this.reloadOrder();
          this.dialogService.openToast('Registro guardado', `Completadas: ${payload.completed_quantity}`, 'check');
        },
        error: (err) => {
          const message = err?.error?.non_field_errors?.[0] ?? 'Error al guardar el registro.';
          this.dialogService.openToast('No se pudo guardar', message, 'fail');
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
    this.shiftModals.close();
    this.selectedSKU.set(sku);
    this.qms.openForEdit(record);
  }

  refreshSession() {
    this.loaderService.showLoader();
    const coreModuleId = this.routeContextService.currentModule?.id;
    const scopeParams = coreModuleId ? { core_module_id: coreModuleId } : undefined;

    this.workSessionService.getActive(scopeParams)
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
