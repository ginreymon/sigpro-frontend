import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { environment } from '../../../../environments/environment.development';
import { ProductionOrdersTable } from '../../../shared/elements/production-orders-table/production-orders-table';
import { ProductionOrderService } from '../../../services/production/production-order-service';
import { WorkSpaceLayout } from '../../../layouts/work-space-layout/work-space-layout';
import { ActivatedRoute, Router } from '@angular/router';
import { WorkSpaceLoaderService } from '../../../services/common/work-space-loader-service';
import { LoaderService } from '../../../services/common/loader-service';
import { finalize } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { OrderSearcher } from '../../../shared/components/order-searcher/order-searcher';
import { ProductionOrder } from '../../../models/production/production-order';
import { UiButton } from '../../../shared/elements/ui-button/ui-button';
import { UiIcon } from '../../../shared/elements/ui-icon/ui-icon';
import { TaskTimer } from '../../../shared/components/task-timer/task-timer';
import { OrderHeader } from '../../../shared/elements/order-header/order-header';
import { WorkShiftSummary } from '../../../shared/components/work-shift-summary/work-shift-summary';
import { EmployeesModal } from '../../../shared/components/employees-modal/employees-modal';
import { ModuleModal } from '../../../shared/components/module-modal/module-modal';
import { WorkShiftModal } from '../../../shared/components/work-shift-modal/work-shift-modal';
import { BalanceBottomSheet } from '../../../shared/components/balance-bottom-sheet/balance-bottom-sheet';
import { SkuTaskDetail } from '../../../models/production/sku-task-detail';
import { TaskTimerService } from '../../../services/common/task-timer-service';
import { DialogService } from '../../../services/common/dialog-service';
import { ProductionRecord } from '../../../models/production/production-record';
import { WorkSession } from '../../../models/production/work-session';
import { ProductionContextService } from '../../../services/production/production-context-service';
import { toSignal } from '@angular/core/rxjs-interop';
import { WorkSessionService } from '../../../services/production/work-session-service';
import { LastRecordCard } from '../../../shared/components/last-record-card/last-record-card';

@Component({
  selector: 'app-shift-cycles',
  imports: [WorkSpaceLayout, FormsModule, OrderSearcher, ProductionOrdersTable, UiButton, UiIcon, TaskTimer, WorkShiftSummary, EmployeesModal, ModuleModal, WorkShiftModal, BalanceBottomSheet, OrderHeader, LastRecordCard],
  templateUrl: './shift-cycles.html',
  styleUrl: './shift-cycles.css',
})
export class ShiftCycles implements OnInit {
  balanceVisible = signal(false);

  openBalance() {
    this.balanceVisible.set(true);
  }

  private DAY_OPERATION_URL = environment.DAY_OPERATION_URL;
  private OPERATION_ORDER_URL = environment.SHIFT_CYCLES_URL;

  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private poService = inject(ProductionOrderService);
  private wslService = inject(WorkSpaceLoaderService);
  private tts = inject(TaskTimerService);
  private dialogService = inject(DialogService);
  private contextService = inject(ProductionContextService);
  private loaderService = inject(LoaderService);
  private workSessionService = inject(WorkSessionService);

  private hasCheckedActiveRecord = false;
  private activeRecord: ProductionRecord | null = null;

  private readonly ALLOWED_COST_CENTERS = [110, 103];
  private context = toSignal(this.contextService.context$, { initialValue: null });

  isLoading = signal(true);
  contextDocTypes = computed(() => this.context()?.docTypes ?? []);
  contextWorkBreaks = computed(() => this.context()?.workBreaks ?? []);
  contextWorkShifts = computed(() => this.context()?.workShifts ?? []);
  contextModules = computed(() => this.context()?.modules ?? []);
  contextEmployees = computed(() =>
    (this.context()?.employees ?? []).filter(e => this.ALLOWED_COST_CENTERS.includes(e.cost_center_rowid!))
  );
  currentSession = signal<WorkSession | null>(null);
  productionOrder = signal<ProductionOrder | null>(null);
  selectedSKU = signal<SkuTaskDetail | null>(null);
  moduleModalVisible = signal(false);
  shiftModalVisible = signal(false);
  employeesModalVisible = signal(false);

  ngOnInit(): void {
    this.loadDocumentFromRoute();
  }

  get document() {
    const doc = this.productionOrder();
    if (!doc) return '';
    return `${doc.documentType} ${doc.documentNumber}`;
  }

  protected preselectedIds = computed(() =>
    this.currentSession()?.employees_snapshot?.map(e => e.id) ?? []
  );

  private reset() {
    this.selectedSKU.set(null);
    this.hasCheckedActiveRecord = false;
    this.activeRecord = null;
  }

  private loadContext(docType?: string, docNumber?: number) {
    this.isLoading.set(true);
    this.wslService.start();
    this.loaderService.showLoader();
    this.contextService.load(docType, docNumber)
      .pipe(finalize(() => {
        this.isLoading.set(false);
        this.wslService.end();
        this.loaderService.hideLoader();
      }))
      .subscribe({
        next: (context) => {
          this.currentSession.set(context.session);
          this.tts.setSession(context.session);
          this.setDocument(context.order);
          this.checkActiveRecord(context.session, context.order);
        },
        error: () => this.router.navigateByUrl(this.DAY_OPERATION_URL),
      });
  }

  private loadDocumentFromRoute() {
    this.productionOrder.set(null);
    this.route.queryParams.subscribe(({ docType, docNumber }) => {
      this.selectedSKU.set(null);
      this.tts.reset();
      this.hasCheckedActiveRecord = false;
      this.activeRecord = null;
      if (!docType || !docNumber) {
        this.productionOrder.set(null);
      }
      this.loadContext(docType || undefined, docNumber ? +docNumber : undefined);
    });
  }

  setDocument(doc: ProductionOrder | null) {
    this.productionOrder.set(doc);
    if (!doc) return;

    this.router.navigate([], {
      queryParams: {
        docType: doc.documentType,
        docNumber: doc.documentNumber,
      },
      queryParamsHandling: 'merge',
    });
  }

  reloadOrder() {
    this.productionOrder.set(null);
    this.reset();
    const { docType, docNumber } = this.route.snapshot.queryParams;
    this.loadContext(docType || undefined, docNumber ? +docNumber : undefined);
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
  }

  private checkActiveRecord(session: WorkSession | null, order: ProductionOrder | null) {
    if (this.hasCheckedActiveRecord) return;
    if (!session || !order) return;
    this.hasCheckedActiveRecord = true;
    const record = session.active_activity?.last_open_production_record;
    if (!record) return;
    this.activeRecord = record;
    this.wslService.start();
    if (record.op_number === order.documentNumber && record.op_type === order.documentType) {
      this.poService.getSkuDetail(record.op_type, record.op_number, record.sku_rowid)
        .pipe(finalize(() => this.wslService.end()))
        .subscribe({
          next: (sku) => {
            if (sku) {
              this.selectedSKU.set(sku);
              this.tts.confirm(record);
            }
          },
        });
    } else {
      this.wslService.end();
      this.showActiveRecordToast();
    }
  }

  openEmployeesSnapshot(): void {
    this.employeesModalVisible.set(true);
  }

  openModuleModal(): void {
    this.moduleModalVisible.set(true);
  }

  openShiftModal(): void {
    this.shiftModalVisible.set(true);
  }

  updateEmployees(ids: number[]) {
    const sessionId = this.currentSession()?.id;
    if (!sessionId) return;
    this.loaderService.showLoader();
    this.workSessionService.updateEmployees(sessionId, ids)
      .pipe(finalize(() => this.loaderService.hideLoader()))
      .subscribe({
        next: () => this.refreshSession(),
      });
  }

  onTaskSaved() {
    this.reset();
    const { docType, docNumber } = this.route.snapshot.queryParams;
    this.loadContext(docType || undefined, docNumber ? +docNumber : undefined);
  }

  onTaskStarted() {
    this.refreshSession();
  }

  private refreshSession() {
    this.loaderService.showLoader();
    this.workSessionService.getActive()
      .pipe(finalize(() => this.loaderService.hideLoader()))
      .subscribe({
        next: (session: WorkSession) => {
          this.currentSession.set(session);
          this.contextService.updateSession(session);
          this.tts.setSession(session);
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
}
