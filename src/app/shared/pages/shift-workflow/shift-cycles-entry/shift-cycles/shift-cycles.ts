import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { finalize, interval } from 'rxjs';
import { ProductionOrder } from '../../../../../models/production/production-order';
import { SkuTaskDetail } from '../../../../../models/production/sku-task-detail';
import { DialogService } from '../../../../../services/common/dialog-service';
import { ProductionRecord } from '../../../../../models/production/production-record';
import { WorkSession } from '../../../../../models/production/work-session';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { WorkSessionService } from '../../../../../services/production/work-session-service';
import { RecentRecordsService } from '../../../../../shared/components/production/cards/recent-records-card/recent-records-card';
import { QuantityModal } from '../../../../../shared/components/production/modals/quantity-modal/quantity-modal';
import { QuantityModalService } from '../../../../../services/common/quantity-modal-service';
import { ProductionRecordService } from '../../../../../services/production/production-record-service';
import { WorkBreakRecord } from '../../../../../models/production/work-break-record';
import { ShiftHourlyRecord } from '../../../../../shared/components/production/widgets/shift-hourly-record/shift-hourly-record';
import { StampingRecord } from '../../../../../shared/components/production/widgets/stamping-record/stamping-record';
import { StampingRecord as StampingRecordModel } from '../../../../../models/stamping/stamping-record';
import { OPStampingService } from '../../../../../services/stamping/op-stamping-service';
import { filterByMachineType } from '../../../../../common/functions/additional-time-filters';
import { StampingRecordService } from '../../../../../services/stamping/stamping-record-service';
import { ProductionContext } from '../../../../../models/production/production-context';
import { BaseProductionOrderPage } from '../../../../../common/classes/base-production-order-page';
import { parseSessionErrors } from '../../../../../common/functions/session-errors';
import { apiNonFieldErrors } from '../../../../../common/functions/api-error';
import { EmployeesSavedData } from '../../../../../services/common/shift-modals-service';
import { ShiftCycleActionKey } from "../../../../../shared/components/production/widgets/shift-cycles-fab/shift-cycles-fab";
import { ShiftModalsService } from '../../../../../services/common/shift-modals-service';
import { ProductionRecordContext } from '../../../../../models/production/production-record-context';
import { ShiftNavigationService } from '../../../../../services/core/shift-navigation-service';
import { RouteContextService } from '../../../../../services/core/route-context-service';
import { ShiftCyclesConfig } from '../../../../../common/interfaces/shift-cycles-config';
import { SHIFT_CYCLES_CONFIG } from '../../../../../common/const/shift-cycles-config';
import { AppConfigService } from '../../../../../services/core/app-config-service';
import { isWithinHourlyWindow } from '../../../../../common/functions/hourly-window';
import { closeWorkSessionAndExit } from '../../../../../common/functions/close-work-session';
import { ProductionTableCustomColumn } from '../../../../../shared/components/production/tables/production-orders-table/production-table-custom-column';
import { ShiftCyclesShell } from '../shift-cycles-shell/shift-cycles-shell';

@Component({
  selector: 'app-shift-cycles',
  imports: [ShiftCyclesShell, QuantityModal, ShiftHourlyRecord, StampingRecord],
  templateUrl: './shift-cycles.html',
  styleUrl: './shift-cycles.css',
})
export class ShiftCycles extends BaseProductionOrderPage {
  inWindow = signal(true);

  private shiftNav = inject(ShiftNavigationService);
  private routeContextService = inject(RouteContextService);

  config: ShiftCyclesConfig =
    SHIFT_CYCLES_CONFIG[this.routeContextService.currentModule?.url ?? ''] ?? SHIFT_CYCLES_CONFIG['production'];

  private dialogService = inject(DialogService);
  private workSessionService = inject(WorkSessionService);
  protected qms = inject(QuantityModalService);
  private appConfig = inject(AppConfigService);
  private productionRecordService = inject(ProductionRecordService);
  private stampingRecordService = inject(StampingRecordService);
  private opStampingService = inject(OPStampingService);
  recentRecordsService: RecentRecordsService | null =
    this.config.showStampingRecord ? this.stampingRecordService : null;
  private destroyRef = inject(DestroyRef);
  shiftModals = inject(ShiftModalsService);

  // Extension points para app-shift-cycles-shell (skeleton de template
  // compartido con ShiftCyclesManual): la variante manual sobreescribe estos
  // hooks en vez de duplicar el bloque de tabla/action-bar en su propio
  // template.
  pendingRecords = computed<Partial<ProductionRecord>[]>(() => []);
  fabHiddenActions: ShiftCycleActionKey[] = [];
  fabVisible = computed(() => this.stampingChecksPassed() || (!this.shiftModals.shiftHourlyVisible() || this.finalizeDay()));
  actionBarJustifyClass = computed<string>(() =>
    (!this.stampingChecksPassed() && this.shiftModals.shiftHourlyVisible() && !this.finalizeDay())
      ? 'justify-end'
      : 'justify-between'
  );
  contentExtraClass = '';

  // En estampación, stamping-orders/detail ya trae todo lo que
  // production-orders/detail trae (colorRows, docStatus, stampingAudit,
  // tracking...) más orderedQty/referenceSams propios — así que reemplaza
  // por completo la fuente de la orden y evita la segunda llamada HTTP.
  // Si el módulo tiene uses_processes_search activo, ni stamping-orders/detail
  // ni production-orders/detail sirven (su colorRows sale mal para OP/OPT en
  // ese formato) — hay que usar production-orders/processes, igual que hace
  // OrderSearcher.fetchOrder. Esto aplica tanto a la búsqueda dentro de la
  // página como a la carga inicial vía query params (?docType=&docNumber=),
  // porque ambos casos comparten este mismo loader.
  protected override orderLoader = this.config.showStampingRecord
    ? (docType: string, docNumber: number, session: WorkSession | null) =>
        session?.current_module?.machine?.uses_processes_search
          ? this.opStampingService.getProductionOrderProcesses(docType, docNumber)
          : this.opStampingService.getOrderDetail(docType, docNumber)
    : undefined;

  private hasCheckedActiveRecord = false;
  private activeRecord: ProductionRecord | null = null;

  private context = toSignal(this.contextService.context$, { initialValue: null });

  lastRecordTrigger = signal(0);
  selectedSKU = signal<SkuTaskDetail | null>(null);

  // SAMs (references) of the order that already have quantities entered
  // (stamped_qty > 0) according to the backend, narrowed by machine type —
  // independent of what was selected in this UI session.
  private samsWithStampedQty = computed(() => {
    const referenceSams = this.productionOrder()?.referenceSams;
    if (!referenceSams) return [];
    const machineTypeId = this.contextService.snapshot?.session?.current_module?.machine?.machine_type_id ?? null;
    return filterByMachineType(referenceSams, machineTypeId)
      .filter((sam) => Number(sam.stamped_qty) > 0);
  });

  // Pieces to stamp per ordered unit = sum of stamped_pieces of those SAMs.
  // A NULL stamped_pieces is omitted from the JSON; default to 1 like the
  // backend pending_qty formula (ISNULL(stamped_pieces, 1)) to avoid NaN.
  totalStampingFactor = computed(() => {
    const sams = this.samsWithStampedQty();
    if (!sams.length) return null;
    return sams.reduce((sum, sam) => sum + Number(sam.stamped_pieces ?? 1), 0);
  });

  // OP-level stamping progress in pieces: ordered units * stamping factor vs.
  // pieces already stamped (same SAM set that defines the factor).
  stampingProgress = computed(() => {
    const factor = this.totalStampingFactor();
    const orderedQty = this.productionOrder()?.orderedQty;
    if (factor == null || orderedQty == null) return null;
    return {
      totalPieces: Number(orderedQty) * factor,
      stampedPieces: this.samsWithStampedQty().reduce((sum, sam) => sum + Number(sam.stamped_qty), 0),
    };
  });

  // Columna "Piezas" solo aplica a máquinas sin uses_processes_search: en
  // procesos (uses_processes_search=true) el conteo por SAM/referencia no
  // aplica, ya que ahí las unidades se buscan por proceso, no por color/talla.
  // Processes search (OP/OPT): the backend already returns each color's total
  // converted to kg in colorRows[].totals, so the column only displays it.
  stampingCustomColumns = computed<ProductionTableCustomColumn[]>(() => {
    if (this.usesProcessesSearch()) {
      return [{ title: 'Metros', tooltip: 'Total en metros por color', templateName: 'kg' }];
    }
    if (this.totalStampingFactor() == null) return [];
    return [{ title: 'Piezas', tooltip: 'Piezas a estampar', templateName: 'piezas' }];
  });

  contextDocTypes = computed(() => this.context()?.docTypes ?? []);

  // Máquina asignada al módulo con uses_processes_search activo: el buscador
  // de OP se restringe a OP/OPT (ver OrderSearcher.restrictToOpAndOpt).
  usesProcessesSearch = computed(() =>
    this.context()?.session?.current_module?.machine?.uses_processes_search ?? false
  );

  get document() {
    const doc = this.productionOrder();
    if (!doc) return '';
    return `${doc.documentType} ${doc.documentNumber}`;
  }

  finalizeDay = computed(() => !!this.currentSession()?.editing_finalized);

  isDocStatusValid = computed(() => {
    const docStatus = this.productionOrder()?.docStatus;
    return docStatus === 1 || docStatus === 2;
  });

  // Solo aplica en estampación: la orden debe estar auditada, con cantidades
  // coincidentes. El paso de corte (tracking) no se usa aquí: el ERP no
  // mantiene actualizado t865_mf_op_operaciones.f865_cant_completa_base para
  // ese centro de trabajo, así que isCompleted queda en falso incluso en
  // OPs con auditoría de estampación ya confirmada — no es una señal fiable.
  stampingChecksPassed = computed(() => {
    if (!this.config.showStampingRecord) return true;
    // Las OPT (orden de producción de terceros) no pasan por auditoría de
    // estampación en el ERP, así que exigir el gate las deja bloqueadas para siempre.
    // if (this.productionOrder()?.documentType?.toUpperCase() === 'OPT') return true;
    // Al verificar que si tiene hasItemId = true se garantiza que sea visibles la OPs y OPTs para sumblimación
    if (this.productionOrder()?.hasItemId) return true;
    const audit = this.productionOrder()?.stampingAudit;
    return !!audit?.isAudited && !!audit?.quantitiesMatch;
  });

  get stampingCheckMessage(): string {
    const audit = this.productionOrder()?.stampingAudit;
    if (!audit?.isAudited) {
      return 'La orden aún no ha sido auditada en estampación.';
    }
    if (!audit?.quantitiesMatch) {
      return 'Las cantidades auditadas no coinciden con las cantidades ordenadas.';
    }
    return '';
  }

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
      .subscribe({
        next: () => {
          this.shiftModals.openShiftHourlyRecord();
          this.qms.close();
          this.refreshAfterSave(() => this.loaderService.hideLoader());
          const parts: string[] = [];
          if (payload.completed_quantity) parts.push(`Completadas: ${payload.completed_quantity}`);
          if (payload.rejected_quantity) parts.push(`Saldos: ${payload.rejected_quantity}`);
          if (payload.scrap_quantity) parts.push(`Bajas: ${payload.scrap_quantity}`);
          this.dialogService.openToast('Cantidades guardadas', parts.join(' · '), 'check');
        },
        error: () => {
          this.loaderService.hideLoader();
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
      .subscribe({
        next: () => {
          this.shiftModals.closeStampingRecord();
          this.refreshAfterSave(() => this.loaderService.hideLoader());
          this.dialogService.openToast('Registro guardado', `Completadas: ${payload.completed_quantity}`, 'check');
        },
        error: (err) => {
          this.loaderService.hideLoader();
          const message = apiNonFieldErrors(err)[0] ?? 'Error al guardar el registro.';
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
      .subscribe({
        next: () => {
          this.shiftModals.openShiftHourlyRecord();
          this.refreshAfterSave(() => this.loaderService.hideLoader());
          this.shiftModals.reloadBalance();
          this.qms.close();
          const parts: string[] = [];
          parts.push(`Completadas: ${payload.completed_quantity}`);
          parts.push(`Saldos: ${payload.rejected_quantity}`);
          parts.push(`Bajas: ${payload.scrap_quantity}`);
          this.dialogService.openToast('Registro actualizado', parts.join(' · '), 'check');
        },
        error: () => {
          this.loaderService.hideLoader();
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
    closeWorkSessionAndExit(
      this.workSessionService,
      this.loaderService,
      this.router,
      this.currentSession()?.id!,
      this.currentSession,
    );
  }
}
