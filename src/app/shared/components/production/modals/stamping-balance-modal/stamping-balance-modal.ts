import { Component, Input, Output, EventEmitter, signal, computed, input, effect, inject } from '@angular/core';
import { BottomSheetShell } from '../../../layout/bottom-sheet-shell/bottom-sheet-shell';
import { UiIcon } from '../../../../elements/ui-icon/ui-icon';
import { DataTable } from '../../../table/data-table/data-table';
import { WorkSession } from '../../../../../models/production/work-session';
import { finalize, switchMap } from 'rxjs';
import { StampingProductivityService } from '../../../../../services/stamping/stamping-productivity-service';
import { ProductivityParams } from '../../../../../models/production/productivity-params';
import { StampingProductivitySummaryRow } from '../../../../../models/stamping/stamping-productivity-summary-row';
import { StampingRecordContext } from '../../../../../models/stamping/stamping-record-context';
import { PaginatedResponse } from '../../../../../common/interfaces/paginated-response';
import { TableColumn } from '../../../../../common/interfaces/table-column';
import { TableActions } from '../../../../../common/interfaces/table-actions';
import { TableTemplate } from '../../../../../directives/table-template';
import { DatePipe, DecimalPipe } from '@angular/common';
import { shiftTimeToUtcIso } from '../../../../../common/functions/date-utils';
import { AppConfigService } from '../../../../../services/core/app-config-service';
import { UiLabelButton } from '../../../../elements/ui-label-button/ui-label-button';
import { DialogService } from '../../../../../services/common/dialog-service';

@Component({
  selector: 'app-stamping-balance-modal',
  imports: [BottomSheetShell, UiIcon, DataTable, TableTemplate, DatePipe, DecimalPipe, UiLabelButton],
  templateUrl: './stamping-balance-modal.html',
  styleUrl: './stamping-balance-modal.css',
})
export class StampingBalanceModal {
  visible = input<boolean>(false);
  reloadTrigger = input<number>(0);
  @Input() shiftEndTime: string | null = null;
  @Input() enable = true;
  @Output() onClose = new EventEmitter<void>();
  @Output() onEditRecord = new EventEmitter<StampingRecordContext>();
  currentSession = input<WorkSession | null>(null);

  isLoading = signal(false);
  hasSearched = signal(false);
  paginatedResponse = signal<PaginatedResponse<StampingProductivitySummaryRow> | null>(null);
  selectedRow = signal<StampingProductivitySummaryRow | null>(null);
  detailResults = signal<StampingRecordContext[]>([]);
  private allResults: StampingProductivitySummaryRow[] = [];
  private allDetailResults: StampingRecordContext[] = [];
  readonly skeletonRows = Array(5).fill(0);
  readonly actions: Partial<TableActions> = {};

  readonly detailColumns: TableColumn<StampingRecordContext>[] = [
    { type: 'template', label: 'Hora Registro', templateName: 'detailEndTemplate' },
    { field: 'ordered_quantity',                 label: 'Ord.' },
    { type: 'template', label: 'Comp.',          templateName: 'detailCompTemplate' },
    { field: 'employee_count',                   label: 'Operarios' },
    { field: 'sam',                               label: 'SAM' },
    { type: 'template', label: 'Pausa (min)',    templateName: 'detailBreakTemplate' },
    { type: 'template', label: '',                templateName: 'detailActionTemplate', align: 'right' },
  ];

  readonly columns: TableColumn<StampingProductivitySummaryRow>[] = [
    { field: 'reference_identification', label: 'Referencia' },
    { field: 'op_type',                  label: 'Tipo Doc' },
    { field: 'op_number',                label: 'N° OP' },
    { type: 'template', label: 'Último Registro', templateName: 'ultimoRegistroTemplate' },
    { type: 'template', label: 'Cantidades',      templateName: 'cantidadesTemplate' },
    { type: 'template', label: '',                templateName: 'createUserTemplate', align: 'right' },
  ];

  constructor(
    private productivityService: StampingProductivityService,
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
    this.hasSearched.set(false);
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
            const rowKey = (r: StampingProductivitySummaryRow) =>
              `${r.op_type}|${r.op_number}|${r.reference_identification}`;
            const refreshed = sorted.find(r => rowKey(r) === rowKey(current));
            if (refreshed) this.openDetail(refreshed);
            else this.closeDetail();
          }
        },
      });
  }

  onSearch(query: string): void {
    const q = query.trim().toLowerCase();
    this.hasSearched.set(q.length > 0);
    const filtered = q
      ? this.allResults.filter(r =>
          [r.op_type, r.op_number, r.reference_identification]
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

  moduleTitle = computed(() => {
    const mod = this.currentSession()?.current_module;
    if (!mod) return 'BALANCE';
    return `BALANCE · MÓDULO ${mod.number} / ${mod.name.toUpperCase()}`;
  });

  detailTitle = computed(() => {
    const r = this.selectedRow();
    if (!r) return '';
    return `${r.reference_identification} / ${r.op_type} ${r.op_number}`;
  });

  openDetail(row: StampingProductivitySummaryRow): void {
    this.allDetailResults = row.records_detail ?? [];
    this.detailResults.set(this.allDetailResults);
    this.selectedRow.set(row);
  }

  closeDetail(): void {
    this.selectedRow.set(null);
    this.detailResults.set([]);
    this.allDetailResults = [];
  }

  updateRecords(record: StampingRecordContext): void {
    if (!this.enable) {
      this.dialogService.openToast('Fuera de la ventana', 'Solo se pueden modificar los registros dentro de la ventana de tiempo o durante la última entrega.', 'fail');
      return;
    }
    this.onEditRecord.emit(record);
  }

  onDetailSearch(query: string): void {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? this.allDetailResults.filter(r => {
          const timeStr = r.record_end
            ? (this.toLocalDate(r.record_end)?.toLocaleString('es-CO') ?? '')
            : '';
          return [r.completed_quantity, r.employee_count]
            .some(v => String(v ?? '').includes(q))
            || timeStr.toLowerCase().includes(q);
        })
      : this.allDetailResults;
    this.detailResults.set(filtered);
  }
}
