import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ProductionOrder } from '../../../../../models/production/production-order';
import { PaginatedResponse } from '../../../../../common/interfaces/paginated-response';
import { TableColumn } from '../../../../../common/interfaces/table-column';
import { TableActions } from '../../../../../common/interfaces/table-actions';
import { TableActionEvent } from '../../../../../common/interfaces/table-action-event';
import { DataTable } from '../../../table/data-table/data-table';
import { buildColorSizeMatrix } from '../production-orders-table/color-size-matrix';

export interface OpColorRow {
  color: string;
  total: number;
  [size: string]: number | string;
}

@Component({
  selector: 'app-order-sku-audit-table',
  imports: [DataTable],
  templateUrl: './order-sku-audit-table.html',
})
export class OrderSkuAuditTable {
  protected columns: TableColumn<OpColorRow>[] = [];
  protected paginatedResponse: PaginatedResponse<OpColorRow> | null = null;

  @Input() actions: Partial<TableActions> = {};

  @Input()
  set productionOrder(order: ProductionOrder | null) {
    if (!order) {
      this.columns = [];
      this.paginatedResponse = null;
      return;
    }

    const { sizes, skuColors } = buildColorSizeMatrix(order);

    this.columns = [
      { field: 'color', label: 'Color SKU' },
      ...sizes.map((size) => ({ field: size, label: size, align: 'center' as const })),
      { field: 'total', label: 'Total', align: 'right' as const },
    ];

    const results: OpColorRow[] = skuColors.map((c) => {
      const row: OpColorRow = { color: c.color, total: c.totals[0].orderedQty };
      c.sizes.forEach((s) => (row[s.size] = s.skuRowId !== 0 ? s.orderedQty : ''));
      return row;
    });

    this.paginatedResponse = { count: results.length, next: null, previous: null, results };
  }

  @Output() onAction = new EventEmitter<TableActionEvent<OpColorRow>>();
}
