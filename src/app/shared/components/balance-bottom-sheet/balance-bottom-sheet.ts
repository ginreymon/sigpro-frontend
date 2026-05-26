import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, signal, computed, input, effect } from '@angular/core';
import { UiButton } from '../../elements/ui-button/ui-button';
import { UiCloseButton } from '../../elements/ui-close-button/ui-close-button';
import { DataTable } from '../data-table/data-table';
import { WorkSession } from '../../../models/production/work-session';
import { ProductivityService } from '../../../services/production/productivity-service';
import { ProductivityParams } from '../../../models/production/productivity-params';
import { ProductivitySummaryRow } from '../../../models/production/productivity-summary-row';
import { PaginatedResponse } from '../../../common/interfaces/paginated-response';
import { TableColumn } from '../../../common/interfaces/table-column';
import { TableActions } from '../../../common/interfaces/table-actions';
import { TableTemplate } from '../../../directives/table-template';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-balance-bottom-sheet',
  imports: [UiButton, UiCloseButton, DataTable, TableTemplate, DatePipe],
  templateUrl: './balance-bottom-sheet.html',
  styleUrl: './balance-bottom-sheet.css',
})
export class BalanceBottomSheet implements OnChanges {
  private readonly BALANCE_END_EXTRA_HOURS = 8;
  
  @Input() visible: boolean = false;
  @Input() shiftEndTime: string | null = null;
  @Output() onClose = new EventEmitter<void>();
  currentSession = input<WorkSession | null>(null);

  paginatedResponse = signal<PaginatedResponse<ProductivitySummaryRow> | null>(null);
  private allResults: ProductivitySummaryRow[] = [];

  readonly actions: Partial<TableActions> = {
    delete: { enabled: true, iconName: 'trash', toolTip: 'Eliminar' },
  };

  readonly columns: TableColumn<ProductivitySummaryRow>[] = [
    { field: 'sku_color',         label: 'Color' },
    { field: 'sku_size',          label: 'Talla' },
    { field: 'op_type',           label: 'Tipo Doc' },
    { field: 'op_number',         label: 'N° OP' },
    { field: 'sku_reference',     label: 'Referencia' },      
    { type: 'template', label: 'Hora Registro',  templateName: 'ultimoRegistroTemplate' },
    { type: 'template', label: 'Cantidades',  templateName: 'cantidadesTemplate' },
  ];

  constructor(private productivityService: ProductivityService) {
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
    this.paginatedResponse.set(null);
    this.productivityService.getSummary({
      ...this.balanceParams()!,
      clientNow: new Date().toISOString(),
    }).subscribe({
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
    return value ? new Date(value) : null;
  }

  isLate(dateStr: string): boolean {
    if (!this.shiftEndTime) return false;
    const [h, m, s] = this.shiftEndTime.split(':').map(Number);
    const shiftEnd = new Date();
    shiftEnd.setHours(h, m, s, 0);
    return new Date(dateStr) > shiftEnd;
  }

  close(): void {
    this.onClose.emit();
  }

  balanceParams = computed<ProductivityParams | null>(() => {
    const session = this.currentSession();
    if (!session) return null;
    return {
      startDate: this.buildShiftDatetime(session.work_shift.start_time),
      endDate: this.buildShiftDatetime(session.work_shift.end_time, this.BALANCE_END_EXTRA_HOURS),
      moduleId: session.module_id,
      shiftId: session.work_shift_id,
    };
  });

  private buildShiftDatetime(timeStr: string, extraHours = 0): string {
    const [h, m, s] = timeStr.split(':').map(Number);
    const d = new Date();
    d.setHours(h + extraHours, m, s, 0);
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  }
}
