import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { ProductionOrder } from '../../../../../models/production/production-order';
import { AuditRecord } from '../../../../../models/stamping/audit-record';
import { TableActions, TableActionType } from '../../../../../common/interfaces/table-actions';
import { TableActionEvent } from '../../../../../common/interfaces/table-action-event';
import { UiIcon } from '../../../../elements/ui-icon/ui-icon';
import { UiTooltip } from '../../../../elements/ui-tooltip/ui-tooltip';
import { TableColumnFilter } from '../../../table/table-column-filter/table-column-filter';
import { UiIconStateDirective } from '../../../../../directives/ui-icon-state-directive';
import { buildColorSizeMatrix } from '../production-orders-table/color-size-matrix';

export interface OpColorRow {
  color: string;
  total: number;
  [size: string]: number | string;
}

@Component({
  selector: 'app-order-sku-audit-table',
  imports: [UiIcon, UiTooltip, TableColumnFilter, UiIconStateDirective],
  templateUrl: './order-sku-audit-table.html',
})
export class OrderSkuAuditTable {
  @ViewChild(TableColumnFilter) private colorFilterPanel!: TableColumnFilter;

  protected sizes: string[] = [];
  protected rows: OpColorRow[] = [];

  // Quantity unit suffix for the Total/Auditada headers (e.g. 'kg'). When set, the order has no real
  // size breakdown (processes orders carry one synthetic row per color), so the size columns are hidden.
  @Input() unit: string | null = null;

  protected get displaySizes(): string[] {
    return this.unit ? [] : this.sizes;
  }

  // Quantities with a unit (processes machines) are decimals: summing them in floating point leaves
  // artifacts like 248.20000000000002, so footer totals are shown with fixed 2 decimals. Other orders unchanged.
  protected formatTotal(value: number): string | number {
    return this.unit ? value.toFixed(2) : value;
  }
  private auditByColor = new Map<string, AuditRecord>();

  @Input() set auditRecords(records: AuditRecord[] | null) {
    this.auditByColor = new Map((records ?? []).map((r) => [r.color, r]));
  }

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
      const row: OpColorRow = { color: c.color, total: c.totals.orderedQty };
      c.skus.forEach((s) => (row[s.size] = s.skuRowId !== 0 ? s.orderedQty : ''));
      return row;
    });
  }

  @Output() onAction = new EventEmitter<TableActionEvent<OpColorRow>>();

  // One-click "audit with the estimated (ordered) quantity" — separate from
  // the generic view/edit/delete action system since it's specific to this
  // table and always pairs with edit (no independent enable/tooltip config
  // needed for a single caller).
  @Input() checkEnabled = false;
  @Output() onCheckRow = new EventEmitter<OpColorRow>();

  protected get filteredRows(): OpColorRow[] {
    if (this.selectedColors.size === 0) return this.rows;
    return this.rows.filter((r) => this.selectedColors.has(r.color));
  }

  protected get hasAnyAction(): boolean {
    return this.checkEnabled || this.actionKeys.some((key) => this._actions[key].enabled);
  }

  protected auditedQty(color: string): number | null {
    return this.auditByColor.get(color)?.audited_quantity ?? null;
  }

  // Meters (CALANDRA, i.e. when `unit` is set) are a separate manual value, never mixed with the kg above.
  protected auditedMeters(color: string): number | null {
    const meters = this.auditByColor.get(color)?.audited_meters;
    return meters == null ? null : Number(meters);
  }

  protected get footerMeters(): number {
    return this.filteredRows.reduce((sum, r) => sum + (this.auditedMeters(r.color) ?? 0), 0);
  }

  // Footer totals — always sum the currently filtered rows (not the full
  // unfiltered set), so the footer stays consistent with what's on screen
  // when the Color SKU filter narrows the rows.
  protected footerSizeTotal(size: string): number {
    return this.filteredRows.reduce((sum, r) => sum + (Number(r[size]) || 0), 0);
  }

  protected get footerTotal(): number {
    return this.filteredRows.reduce((sum, r) => sum + r.total, 0);
  }

  protected get footerAudited(): number {
    return this.filteredRows.reduce((sum, r) => sum + (this.auditedQty(r.color) ?? 0), 0);
  }

  // Footer status mirrors matchesTotal(row): false as soon as one row is
  // wrong, true only when every row matches, null while some are still
  // unaudited but none are wrong yet.
  protected get footerMatchesTotal(): boolean | null {
    if (this.filteredRows.some((r) => this.matchesTotal(r) === false)) return false;
    if (this.filteredRows.every((r) => this.matchesTotal(r) === true)) return true;
    return null;
  }

  // null = no audit record for this color yet (nothing to compare).
  protected matchesTotal(row: OpColorRow): boolean | null {
    const record = this.auditByColor.get(row.color);
    if (!record) return null;
    return record.audited_quantity === row.total;
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

  protected checkHandler(row: OpColorRow): void {
    this.onCheckRow.emit(row);
  }
}
