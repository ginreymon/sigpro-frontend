import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, signal, inject } from '@angular/core';
import { Observable, Subscription, finalize, switchMap } from 'rxjs';
import { DatePipe } from '@angular/common';
import { BottomSheetShell } from '../../../layout/bottom-sheet-shell/bottom-sheet-shell';
import { UiIcon } from '../../../../elements/ui-icon/ui-icon';
import { DataTable } from '../../../table/data-table/data-table';
import { TableTemplate } from '../../../../../directives/table-template';
import { ProductivityService } from '../../../../../services/production/productivity-service';
import { ProductivitySummaryRow } from '../../../../../models/production/productivity-summary-row';
import { ProductivityParams } from '../../../../../models/production/productivity-params';
import { StampingProductivitySummaryRow } from '../../../../../models/stamping/stamping-productivity-summary-row';
import { PaginatedResponse } from '../../../../../common/interfaces/paginated-response';
import { TableColumn } from '../../../../../common/interfaces/table-column';
import { TableActions } from '../../../../../common/interfaces/table-actions';
import { AppConfigService } from '../../../../../services/core/app-config-service';

export interface BalanceSummaryService {
  getBalanceSummary(p: ProductivityParams): Observable<PaginatedResponse<any>>;
}

@Component({
  selector: 'app-balance-summary-modal',
  imports: [BottomSheetShell, UiIcon, DataTable, TableTemplate, DatePipe],
  templateUrl: './balance-summary-modal.html',
})
export class BalanceSummaryModal implements OnChanges {
  @Input() visible: boolean = false;
  @Input() startDate: string | null = null;
  @Input() endDate: string | null = null;
  @Input() moduleId: number | undefined = undefined;
  @Input() title: string = 'Balance de producción';
  /** Overrides the production service (e.g. the stamping one). */
  @Input() service: BalanceSummaryService | null = null;
  /** Stamping layout: SAM reference columns, no saldos/bajas. */
  @Input() stamping: boolean = false;
  @Output() onClose = new EventEmitter<void>();

  isLoading = signal(false);
  hasSearched = signal(false);
  paginatedResponse = signal<PaginatedResponse<ProductivitySummaryRow> | null>(null);
  private allResults: ProductivitySummaryRow[] = [];

  readonly skeletonRows = Array(5).fill(0);
  readonly actions: Partial<TableActions> = {};

  private readonly productionColumns: TableColumn<ProductivitySummaryRow>[] = [
    { field: 'sku_color',     label: 'Color' },
    { field: 'sku_size',      label: 'Talla' },
    { field: 'sku_reference', label: 'Referencia' },
    { field: 'op_type',       label: 'Tipo Doc' },
    { field: 'op_number',     label: 'N° OP', mobileSecondary: true },
    { type: 'template', label: 'Último Registro', templateName: 'ultimoRegistroTemplate' },
    { type: 'template', label: 'Cantidades',      templateName: 'cantidadesTemplate' },
  ];

  // Stamping groups by SAM reference (no color/size) and has no saldos/bajas.
  private readonly stampingColumns: TableColumn<StampingProductivitySummaryRow>[] = [
    { field: 'reference_identification', label: 'Referencia' },
    { field: 'op_type',                  label: 'Tipo Doc' },
    { field: 'op_number',                label: 'N° OP', mobileSecondary: true },
    { type: 'template', label: 'Último Registro', templateName: 'ultimoRegistroTemplate' },
    { type: 'template', label: 'Cantidades',      templateName: 'cantidadesTemplate' },
  ];

  private readonly productionSearchFields = ['module_name', 'op_type', 'op_number', 'sku_reference', 'sku_color', 'sku_size'];
  private readonly stampingSearchFields = ['module_name', 'op_type', 'op_number', 'reference_identification'];

  get columns(): TableColumn<any>[] {
    return this.stamping ? this.stampingColumns : this.productionColumns;
  }

  private defaultProductivityService = inject(ProductivityService);

  private get productivityService(): BalanceSummaryService {
    return this.service ?? this.defaultProductivityService;
  }
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

  private loadSub?: Subscription;

  private loadData(): void {
    if (!this.startDate || !this.endDate) return;
    // Cancel the previous load so an older response cannot overwrite the newer one.
    this.loadSub?.unsubscribe();
    this.isLoading.set(true);
    this.hasSearched.set(false);
    this.paginatedResponse.set(null);
    this.loadSub = this.appConfig.load().pipe(
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
    const fields = this.stamping ? this.stampingSearchFields : this.productionSearchFields;
    const filtered = q
      ? this.allResults.filter(r =>
          fields.some(f => String((r as unknown as Record<string, unknown>)[f] ?? '').toLowerCase().includes(q))
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
