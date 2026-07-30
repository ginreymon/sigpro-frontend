import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { ProductionOrder } from '../../../../../models/production/production-order';
import { TableActions, TableActionType } from '../../../../../common/interfaces/table-actions';
import { TableActionEvent } from '../../../../../common/interfaces/table-action-event';
import { UiIcon } from '../../../../elements/ui-icon/ui-icon';
import { UiTooltip } from '../../../../elements/ui-tooltip/ui-tooltip';
import { TableColumnFilter } from '../../../table/table-column-filter/table-column-filter';
import { buildColorSizeMatrix } from '../production-orders-table/color-size-matrix';

export interface OpColorRow {
  color: string;
  total: number;
  [size: string]: number | string;
}

@Component({
  selector: 'app-order-sku-audit-table',
  imports: [UiIcon, UiTooltip, TableColumnFilter],
  templateUrl: './order-sku-audit-table.html',
})
export class OrderSkuAuditTable {
  @ViewChild(TableColumnFilter) private colorFilterPanel!: TableColumnFilter;

  protected sizes: string[] = [];
  protected rows: OpColorRow[] = [];

  private selectedColors = new Set<string>();
  protected colorFilterOpen = false;

  protected readonly actionKeys: TableActionType[] = ['view', 'edit', 'delete'];
  protected _actions: TableActions = {
    view: { enabled: false },
    edit: { enabled: false },
    delete: { enabled: false },
    create: { enabled: false },
  };

  @Input() set actions(value: Partial<TableActions>) {
    (Object.keys(this._actions) as TableActionType[]).forEach((key) => {
      this._actions[key] = { ...this._actions[key], ...value?.[key] };
    });
  }

  @Input()
  set productionOrder(order: ProductionOrder | null) {
    this.selectedColors.clear();

    if (!order) {
      this.sizes = [];
      this.rows = [];
      return;
    }

    const matrix = buildColorSizeMatrix(order);
    this.sizes = matrix.sizes;

    this.rows = matrix.skuColors.map((c) => {
      const row: OpColorRow = { color: c.color, total: c.totals[0].orderedQty };
      c.sizes.forEach((s) => (row[s.size] = s.skuRowId !== 0 ? s.orderedQty : ''));
      return row;
    });
  }

  @Output() onAction = new EventEmitter<TableActionEvent<OpColorRow>>();

  protected get filteredRows(): OpColorRow[] {
    if (this.selectedColors.size === 0) return this.rows;
    return this.rows.filter((r) => this.selectedColors.has(r.color));
  }

  protected get hasAnyAction(): boolean {
    return this.actionKeys.some((key) => this._actions[key].enabled);
  }

  protected get colorFilterValues(): string[] {
    return [...new Set(this.rows.map((r) => r.color))].sort((a, b) => a.localeCompare(b));
  }

  protected get isColorFilterActive(): boolean {
    return this.selectedColors.size > 0;
  }

  protected readonly isColorChecked = (value: any): boolean => this.selectedColors.has(value);

  protected toggleColorFilterDropdown(event: MouseEvent): void {
    event.stopPropagation();
    if (this.colorFilterOpen) {
      this.colorFilterPanel.close();
      return;
    }
    this.colorFilterOpen = true;
    this.colorFilterPanel.open(event.currentTarget as HTMLElement);
  }

  protected toggleColorValue(value: any): void {
    if (this.selectedColors.has(value)) this.selectedColors.delete(value);
    else this.selectedColors.add(value);
  }

  protected clearColorFilter(): void {
    this.selectedColors.clear();
    this.colorFilterPanel.close();
  }

  protected onColorFilterClosed(): void {
    this.colorFilterOpen = false;
  }

  protected actionHandler(row: OpColorRow, type: TableActionType): void {
    this.onAction.emit({ obj: row, type, action: this._actions[type] });
  }
}
