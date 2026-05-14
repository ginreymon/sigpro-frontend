import { Component, computed, inject, OnInit, signal } from '@angular/core';
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
import { UpperCasePipe } from '@angular/common';
import { UiIcon } from '../../../shared/elements/ui-icon/ui-icon';
import { TaskTimer } from "../../../shared/components/task-timer/task-timer";
import { WorkShiftSummary } from '../../../shared/components/work-shift-summary/work-shift-summary';
import { EmployeesModal } from '../../../shared/components/employees-modal/employees-modal';
import { SkuTaskDetail } from '../../../models/production/sku-task-detail';
import { TaskTimerService } from '../../../services/common/task-timer-service';
import { DialogService } from '../../../services/common/dialog-service';
import { ProductionRecord } from '../../../models/production/production-record';
import { WorkSession } from '../../../models/production/work-session';
import { ProductionContextService } from '../../../services/production/production-context-service';
import { toSignal } from '@angular/core/rxjs-interop';
import { WorkShiftCard } from '../../../common/interfaces/work-shift-card';

@Component({
  selector: 'app-orders',
  imports: [WorkSpaceLayout, FormsModule, OrderSearcher, ProductionOrdersTable, UiButton, UpperCasePipe, UiIcon, TaskTimer, WorkShiftSummary, EmployeesModal],
  templateUrl: './orders.html',
  styleUrl: './orders.css',
})
export class Orders implements OnInit {

  private DAY_OPERATION_URL = 'production/day-operation';
  private OPERATION_ORDER_URL = 'production/orders';

  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private poService = inject(ProductionOrderService);
  private wslService = inject(WorkSpaceLoaderService);
  private tts = inject(TaskTimerService);
  private dialogService = inject(DialogService);
  private contextService = inject(ProductionContextService);
  private loaderService = inject(LoaderService);

  private hasCheckedActiveRecord = false;
  private activeRecord: ProductionRecord | null = null;

  private context = toSignal(this.contextService.context$, { initialValue: null });

  isLoading = signal(true);
  contextDocTypes = computed(() => this.context()?.docTypes ?? []);
  contextWorkBreaks = computed(() => this.context()?.workBreaks ?? []);
  currentSession = signal<WorkSession | null>(null);
  productionOrder = signal<ProductionOrder | null>(null);
  cards = signal<WorkShiftCard[]>([]);
  selectedSKU = signal<SkuTaskDetail | null>(null);
  workShiftCards = signal<WorkShiftCard[]>([]);

  ngOnInit(): void {
    this.loadDocumentFromRoute();
  }

  get document() {
    const doc = this.productionOrder();
    if (!doc) return '';
    return `${doc.documentType} ${doc.documentNumber}`;
  }

  private reset() {
    this.cards.set([]);
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
          this.setWorkShiftCards(context.session);
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
        this.cards.set([]);
      }
      this.loadContext(docType || undefined, docNumber ? +docNumber : undefined);
    });
  }

  setWorkShiftCards(s: WorkSession | null) {
    this.workShiftCards.set([
      { title: 'Módulo', iconName: 'screwdriverWrench', data: `${s?.current_module?.number} ${s?.current_module?.name}` },
      { title: 'Turno', iconName: 'alarmClock', data: `${s?.work_shift.name} : ${s?.work_shift.start_time.slice(0, 5)} - ${s?.work_shift.end_time.slice(0, 5)}` },
      { title: 'Encomendados', iconName: 'user', data: s?.employees_snapshot?.length ?? 0, action: () => this.openEmployeesSnapshot() },
      { title: 'Acumuladas', data: 10, thresholds: { green: 8, red: 5 } },
      { title: 'Eficiencia', data: 20, thresholds: { green: 90, red: 70 } },
      { title: 'Meta', data: 30, thresholds: { green: 25, red: 15 } },
    ]);
  }

  setDocument(doc: ProductionOrder | null) {
    this.productionOrder.set(doc);
    this.cards.set([]);
    if (!doc) return;

    this.router.navigate([], {
      queryParams: {
        docType: doc.documentType,
        docNumber: doc.documentNumber,
      },
      queryParamsHandling: 'merge',
    });

    this.cards.set([
      { title: 'OP', data: `${doc.documentType} ${doc.documentNumber}` },
      { title: 'Referencia', data: doc.reference },
      { title: 'Tipo de Confección', data: doc.classification.manufacture },
      { title: 'Tipo de Estampación', data: doc.classification.print },
      { title: 'Marca/Línea', data: `${doc.classification.brand}/${doc.classification.line}` },
      { title: 'Clasifi. Comercial', data: doc.classification.commercial },
    ]);
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
    this.dialogService.openModal('Encomendados');
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
