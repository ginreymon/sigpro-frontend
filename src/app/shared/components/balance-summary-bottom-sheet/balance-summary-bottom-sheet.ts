import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, signal, inject } from '@angular/core';
import { finalize, switchMap } from 'rxjs';
import { DatePipe } from '@angular/common';
import { BottomSheetShell } from '../bottom-sheet-shell/bottom-sheet-shell';
import { UiIcon } from '../../elements/ui-icon/ui-icon';
import { DataTable } from '../data-table/data-table';
import { TableTemplate } from '../../../directives/table-template';
import { ProductivityService } from '../../../services/production/productivity-service';
import { ProductivitySummaryRow } from '../../../models/production/productivity-summary-row';
import { PaginatedResponse } from '../../../common/interfaces/paginated-response';
import { TableColumn } from '../../../common/interfaces/table-column';
import { TableActions } from '../../../common/interfaces/table-actions';
import { AppConfigService } from '../../../services/core/app-config-service';

@Component({
  selector: 'app-balance-summary-bottom-sheet',
  imports: [BottomSheetShell, UiIcon, DataTable, TableTemplate, DatePipe],
  templateUrl: './balance-summary-bottom-sheet.html',
})
export class BalanceSummaryBottomSheet implements OnChanges {
  @Input() visible: boolean = false;
  @Input() startDate: string | null = null;
  @Input() endDate: string | null = null;
  @Input() moduleId: number | undefined = undefined;
  @Input() title: string = 'Balance de producción';
  @Output() onClose = new EventEmitter<void>();

  isLoading = signal(false);
  hasSearched = signal(false);
  paginatedResponse = signal<PaginatedResponse<ProductivitySummaryRow> | null>(null);
  private allResults: ProductivitySummaryRow[] = [];

  readonly skeletonRows = Array(5).fill(0);
  readonly actions: Partial<TableActions> = {};

  readonly columns: TableColumn<ProductivitySummaryRow>[] = [  
    { field: 'sku_color',     label: 'Color' },
    { field: 'sku_size',      label: 'Talla' },
    { field: 'sku_reference', label: 'Referencia' },
    { field: 'op_type',       label: 'Tipo Doc' },
    { field: 'op_number',     label: 'N° OP', mobileSecondary: true },
    { type: 'template', label: 'Último Registro', templateName: 'ultimoRegistroTemplate' },
    { type: 'template', label: 'Cantidades',           templateName: 'cantidadesTemplate' },
  ];

  private productivityService = inject(ProductivityService);
  private appConfig = inject(AppConfigService);

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible']) {
      if (changes['visible'].currentValue && !changes['visible'].previousValue) {
        this.loadData();
      }
      if (!changes['visible'].currentValue) {
        this.paginatedResponse.set(null);
        this.allResults = [];
        this.hasSearched.set(false);
      }
    }
  }

  private loadData(): void {
    if (!this.startDate || !this.endDate) return;
    this.isLoading.set(true);
    this.hasSearched.set(false);
    this.paginatedResponse.set(null);
    this.appConfig.load().pipe(
      switchMap(() => this.productivityService.getBalanceSummary({
        startDate: this.startDate!,
        endDate: this.endDate!,
        clientNow: new Date().toISOString(),
        moduleId: this.moduleId,
      })),
      finalize(() => this.isLoading.set(false)),
    ).subscribe({
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
    this.hasSearched.set(q.length > 0);
    const filtered = q
      ? this.allResults.filter(r =>
          [r.module_name, r.op_type, r.op_number, r.sku_reference, r.sku_color, r.sku_size]
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

  close(): void {
    this.onClose.emit();
  }
}
