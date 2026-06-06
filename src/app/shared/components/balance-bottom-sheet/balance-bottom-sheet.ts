import { Component, Input, Output, EventEmitter, signal, computed, input, effect, inject } from '@angular/core';
import { BottomSheetShell } from '../bottom-sheet-shell/bottom-sheet-shell';
import { UiIcon } from '../../elements/ui-icon/ui-icon';
import { DataTable } from '../data-table/data-table';
import { WorkSession } from '../../../models/production/work-session';
import { finalize, switchMap } from 'rxjs';
import { ProductivityService } from '../../../services/production/productivity-service';
import { ProductivityParams } from '../../../models/production/productivity-params';
import { ProductivitySummaryRow } from '../../../models/production/productivity-summary-row';
import { ProductionRecordContext } from '../../../models/production/production-record-context';
import { PaginatedResponse } from '../../../common/interfaces/paginated-response';
import { TableColumn } from '../../../common/interfaces/table-column';
import { TableActions } from '../../../common/interfaces/table-actions';
import { TableTemplate } from '../../../directives/table-template';
import { DatePipe, DecimalPipe } from '@angular/common';
import { shiftTimeToUtcIso } from '../../../common/functions/date-utils';
import { AppConfigService } from '../../../services/core/app-config-service';
import { UiLabelButton } from "../../elements/ui-label-button/ui-label-button";
import { DialogService } from '../../../services/common/dialog-service';
import { ProductionOrderService } from '../../../services/production/production-order-service';
import { LoaderService } from '../../../services/common/loader-service';
import { SkuTaskDetail } from '../../../models/production/sku-task-detail';

@Component({
  selector: 'app-balance-bottom-sheet',
  imports: [BottomSheetShell, UiIcon, DataTable, TableTemplate, DatePipe, DecimalPipe, UiLabelButton],
  templateUrl: './balance-bottom-sheet.html',
  styleUrl: './balance-bottom-sheet.css',
})
export class BalanceBottomSheet {
  visible = input<boolean>(false);
  reloadTrigger = input<number>(0);
  @Input() shiftEndTime: string | null = null;
  @Input() enable = true;
  @Output() onClose = new EventEmitter<void>();
  @Output() onEditRecord = new EventEmitter<{ sku: SkuTaskDetail; record: ProductionRecordContext }>();
  currentSession = input<WorkSession | null>(null);

  isLoading = signal(false);
  paginatedResponse = signal<PaginatedResponse<ProductivitySummaryRow> | null>(null);
  selectedRow = signal<ProductivitySummaryRow | null>(null);
  detailResults = signal<ProductionRecordContext[]>([]);
  private allResults: ProductivitySummaryRow[] = [];
  private allDetailResults: ProductionRecordContext[] = [];
  private poService = inject(ProductionOrderService);
  private loaderService = inject(LoaderService);
  readonly skeletonRows = Array(5).fill(0);
  readonly actions: Partial<TableActions> = {};

  readonly detailColumns: TableColumn<ProductionRecordContext>[] = [
    { type: 'template', label: 'Hora Registro',  templateName: 'detailEndTemplate' },
    { field: 'ordered_quantity',                  label: 'Ord.' },
    { type: 'template', label: 'Comp.',           templateName: 'detailCompTemplate' },
    { type: 'template', label: 'Saldos',          templateName: 'detailRejectedTemplate' },
    { type: 'template', label: 'Bajas',           templateName: 'detailScrapTemplate' },
    { field: 'employee_count',                    label: 'Operarios' },
    { field: 'sku_sam',                           label: 'SAM' },
    { type: 'template', label: 'Pausa (min)',     templateName: 'detailBreakTemplate' },
    { type: 'template', label: '',                templateName: 'detailActionTemplate', align: 'right' },
  ];

  readonly columns: TableColumn<ProductivitySummaryRow>[] = [
    { field: 'sku_color',         label: 'Color' },
    { field: 'sku_size',          label: 'Talla' },
    { field: 'sku_reference',     label: 'Referencia' },      
    { field: 'op_type',           label: 'Tipo Doc' },
    { field: 'op_number',         label: 'N° OP' },
    { type: 'template', label: 'Hora Último Registro',  templateName: 'ultimoRegistroTemplate' },
    { type: 'template', label: 'Cantidades',  templateName: 'cantidadesTemplate' },
    { type: 'template', label: '',            templateName: 'createUserTemplate', align: 'right' },
  ];

  constructor(
    private productivityService: ProductivityService,
    private appConfig: AppConfigService,
    private dialogService: DialogService,
  ) {
    effect(() => {
      const session = this.currentSession();
      const isVisible = this.visible();
      this.reloadTrigger();
      if (session && isVisible) this.loadData();
    });
  }

  private loadData(): void {
    this.isLoading.set(true);
    this.paginatedResponse.set(null);
    this.appConfig.load().pipe(
      switchMap(() => this.productivityService.getShiftSummary({
        ...this.balanceParams()!,
        clientNow: new Date().toISOString(),
      })),
      finalize(() => this.isLoading.set(false)),
    )
      .subscribe({
        next: (response) => {
          const sorted = [...response.results].sort((a, b) => {
            if (!a.last_record_end) return 1;
            if (!b.last_record_end) return -1;
            return new Date(b.last_record_end).getTime() - new Date(a.last_record_end).getTime();
          });
          this.allResults = sorted;
          this.paginatedResponse.set({ ...response, results: sorted });

          const current = this.selectedRow();
          if (current) {
            const rowKey = (r: ProductivitySummaryRow) =>
              `${r.op_type}|${r.op_number}|${r.sku_reference}|${r.sku_color}|${r.sku_size}`;
            const refreshed = sorted.find(r => rowKey(r) === rowKey(current));
            if (refreshed) this.openDetail(refreshed);
            else this.closeDetail();
          }
        },
      });
  }

  onSearch(query: string): void {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? this.allResults.filter(r =>
          [r.op_type, r.op_number, r.sku_reference, r.sku_color, r.sku_size]
            .some(v => String(v ?? '').toLowerCase().includes(q))
        )
      : this.allResults;
    const current = this.paginatedResponse();
    if (current) this.paginatedResponse.set({ ...current, results: filtered });
  }

  toLocalDate(value: string | null): Date | null {
    if (!value) return null;
    const iso = value.endsWith('Z') || value.includes('+') ? value : value + 'Z';
    return new Date(iso);
  }

  isLate(dateStr: string): boolean {
    if (!this.shiftEndTime) return false;
    const [h, m, s] = this.shiftEndTime.split(':').map(Number);
    const shiftEnd = new Date();
    shiftEnd.setHours(h, m, s, 0);
    const iso = dateStr.endsWith('Z') || dateStr.includes('+') ? dateStr : dateStr + 'Z';
    return new Date(iso) > shiftEnd;
  }

  close(): void {
    this.onClose.emit();
  }

  balanceParams = computed<ProductivityParams | null>(() => {
    const session = this.currentSession();
    if (!session) return null;
    const startDate = shiftTimeToUtcIso(session.work_shift.start_time);
    const endDate = new Date(new Date(startDate).getTime() + 24 * 60 * 60 * 1000).toISOString();
    return {
      startDate,
      endDate,
      moduleId: session.current_module?.id,
      shiftId: session.work_shift?.id,
    };
  });

  detailTitle = computed(() => {
    const r = this.selectedRow();
    if (!r) return '';
    return `${r.sku_color} · TALLA ${r.sku_size} — REF ${r.sku_reference} — ${r.op_type} ${r.op_number} `;
  });

  openDetail(row: ProductivitySummaryRow): void {
    this.allDetailResults = row.records_detail ?? [];
    this.detailResults.set(this.allDetailResults);
    this.selectedRow.set(row);
  }

  closeDetail(): void {
    this.selectedRow.set(null);
    this.detailResults.set([]);
    this.allDetailResults = [];
  }

  onDetailSearch(query: string): void {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? this.allDetailResults.filter(r => {
          const timeStr = r.record_end
            ? (this.toLocalDate(r.record_end)?.toLocaleString('es-CO') ?? '')
            : '';
          return [r.completed_quantity, r.scrap_quantity, r.rejected_quantity, r.employee_count]
            .some(v => String(v ?? '').includes(q))
            || timeStr.toLowerCase().includes(q);
        })
      : this.allDetailResults;
    this.detailResults.set(filtered);
  }

  updateRecords(record: ProductionRecordContext): void {
    if (!this.enable) {
      this.dialogService.openToast('Fuera de la ventana', 'Solo se pueden modificar los registros dentro de la ventana de tiempo.', 'fail');
      return;
    }
    this.loaderService.showLoader();
    this.poService.getSkuDetail(record.op_type, record.op_number, record.sku_rowid)
      .pipe(finalize(() => this.loaderService.hideLoader()))
      .subscribe({
        next: (sku) => this.onEditRecord.emit({ sku, record }),
      });    
  }
}
