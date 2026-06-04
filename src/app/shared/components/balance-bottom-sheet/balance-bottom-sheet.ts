import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, signal, computed, input, effect } from '@angular/core';
import { BottomSheetShell } from '../bottom-sheet-shell/bottom-sheet-shell';
import { UiIcon } from '../../elements/ui-icon/ui-icon';
import { DataTable } from '../data-table/data-table';
import { WorkSession } from '../../../models/production/work-session';
import { finalize, switchMap } from 'rxjs';
import { ProductivityService } from '../../../services/production/productivity-service';
import { ProductivityParams } from '../../../models/production/productivity-params';
import { ProductivitySummaryRow } from '../../../models/production/productivity-summary-row';
import { PaginatedResponse } from '../../../common/interfaces/paginated-response';
import { TableColumn } from '../../../common/interfaces/table-column';
import { TableActions } from '../../../common/interfaces/table-actions';
import { TableTemplate } from '../../../directives/table-template';
import { DatePipe } from '@angular/common';
import { shiftTimeToUtcIso } from '../../../common/functions/date-utils';
import { AppConfigService } from '../../../services/core/app-config-service';
import { UiLabelButton } from "../../elements/ui-label-button/ui-label-button";
import { DialogService } from '../../../services/common/dialog-service';

@Component({
  selector: 'app-balance-bottom-sheet',
  imports: [BottomSheetShell, UiIcon, DataTable, TableTemplate, DatePipe, UiLabelButton],
  templateUrl: './balance-bottom-sheet.html',
  styleUrl: './balance-bottom-sheet.css',
})
export class BalanceBottomSheet implements OnChanges {
  @Input() visible: boolean = false;
  @Input() shiftEndTime: string | null = null;
  @Input() inWindow = true;
  @Output() onClose = new EventEmitter<void>();
  currentSession = input<WorkSession | null>(null);

  isLoading = signal(false);
  paginatedResponse = signal<PaginatedResponse<ProductivitySummaryRow> | null>(null);
  private allResults: ProductivitySummaryRow[] = [];
  readonly skeletonRows = Array(5).fill(0);

  readonly actions: Partial<TableActions> = {
    // edit: { enabled: true, iconName: 'pencil', toolTip: 'Editar' },
  };

  readonly columns: TableColumn<ProductivitySummaryRow>[] = [
    { field: 'sku_color',         label: 'Color' },
    { field: 'sku_size',          label: 'Talla' },
    { field: 'op_type',           label: 'Tipo Doc' },
    { field: 'op_number',         label: 'N° OP' },
    { field: 'sku_reference',     label: 'Referencia' },      
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
      if (session && this.visible) this.loadData();
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible']?.currentValue === true && this.currentSession()) {
      this.loadData();
    }
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

  updateRecords(row: ProductivitySummaryRow): void {
    if (!this.inWindow) {
      this.dialogService.openToast('Fuera de ventana', 'Solo puedes modificar registros dentro de la ventana de tiempo.', 'fail');
      return;
    }
    console.log(row);
  }
}
