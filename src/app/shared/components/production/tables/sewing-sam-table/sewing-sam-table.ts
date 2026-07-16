import { Component, inject, OnInit, signal } from '@angular/core';
import { finalize } from 'rxjs';
import { TableColumn } from '../../../../../common/interfaces/table-column';
import { PaginatedResponse } from '../../../../../common/interfaces/paginated-response';
import { QueryParams } from '../../../../../common/interfaces/query-params';
import { SkuItemReference } from '../../../../../models/production/sku-item-reference';
import { SkuItemReferenceService } from '../../../../../services/production/sku-item-reference-service';
import { WorkSpaceLoaderService } from '../../../../../services/common/work-space-loader-service';
import { DataTable } from '../../../table/data-table/data-table';
import { TableTemplate } from '../../../../../directives/table-template';
import { SamTargetCalculator } from '../../widgets/sam-target-calculator/sam-target-calculator';
import { SamTargetCalculatorPanel } from '../../widgets/sam-target-calculator/sam-target-calculator-panel';
import { SamCalculatorStateService } from '../../widgets/sam-target-calculator/sam-calculator-state';
import { environment } from '../../../../../../environments/environment';

@Component({
  selector: 'app-sewing-sam-table',
  imports: [DataTable, TableTemplate, SamTargetCalculator, SamTargetCalculatorPanel],
  providers: [SamCalculatorStateService],
  templateUrl: './sewing-sam-table.html',
})
export class SewingSamTable implements OnInit {
  private service = inject(SkuItemReferenceService);
  private wslService = inject(WorkSpaceLoaderService);

  paginatedResponse = signal<PaginatedResponse<SkuItemReference> | null>(null);

  private page = 1;
  private limit = environment.DEFAULT_PAGE_SIZE;
  private searchTerm = '';

  readonly columns: TableColumn<SkuItemReference>[] = [
    { field: 'reference', label: 'Referencia' },
    { field: 'line', label: 'Línea' },
    { field: 'sewing', label: 'Centro de costo' },
    { field: 'sku_status', label: 'Estado' },
    { type: 'template', label: 'SAM', templateName: 'samTemplate' },
  ];

  ngOnInit(): void {
    this.getData({ limit: this.limit, offset: 0 });
  }

  searchHandler(value: string): void {
    this.searchTerm = value;
    this.page = 1;
    this.getData({ limit: this.limit, offset: 0, search: value || undefined });
  }

  pagerHandler(value: { page: number; pageSize: number }): void {
    if (value.page !== this.page) this.page = value.page;
    if (this.limit !== value.pageSize) {
      this.limit = value.pageSize;
      this.page = 1;
    }
    this.getData({
      limit: this.limit,
      offset: (this.page - 1) * this.limit,
      search: this.searchTerm || undefined,
    });
  }

  private getData(params: QueryParams): void {
    this.wslService.start();
    this.service
      .getAll(params)
      .pipe(finalize(() => this.wslService.end()))
      .subscribe((res) => this.paginatedResponse.set(res));
  }
}
