import { Component, ContentChildren, EventEmitter, Input, Output, QueryList, TemplateRef, ViewChild, } from '@angular/core';
import { TableColumn } from '../../../../common/interfaces/table-column';
import { TablePager } from '../table-pager/table-pager';
import { PaginatedResponse } from '../../../../common/interfaces/paginated-response';
import { TableTools } from '../table-tools/table-tools';
import { environment } from '../../../../../environments/environment';
import { UiIcon } from '../../../elements/ui-icon/ui-icon';
import { UiTooltip } from '../../../elements/ui-tooltip/ui-tooltip';
import { TableRow } from '../../../../common/interfaces/table-row';
import { TableActions, TableActionType } from '../../../../common/interfaces/table-actions';
import { NgTemplateOutlet, DecimalPipe } from '@angular/common';
import { UiCheckbox } from '../../../elements/ui-checkbox/ui-checkbox';
import { FormsModule } from '@angular/forms';
import { TableTemplate, TableTemplateContext } from '../../../../directives/table-template';
import { TableToolsButtons, TableToolsButtonType } from '../../../../common/interfaces/table-tools-buttons';
import { TableActionEvent } from '../../../../common/interfaces/table-action-event';
import { UiIconStateDirective } from "../../../../directives/ui-icon-state-directive";
import { TableColumnFilter } from '../table-column-filter/table-column-filter';
import {
  buildTableColumns,
  getPrimaryColumn,
  getMobileActionsColumn,
  getMobileSecondaryColumn,
  getDetailColumns,
  getFooterSecondaryColumn,
  getFooterDetailColumns,
} from './table-column-utils';
import { TableFilterState } from './table-filter-state';

@Component({
  selector: 'app-data-table',
  imports: [TablePager, TableTools, UiIcon, UiTooltip, NgTemplateOutlet, UiCheckbox, FormsModule, UiIconStateDirective, DecimalPipe, TableColumnFilter],
  templateUrl: './data-table.html',
  styleUrl: './data-table.css',
})
export class DataTable<T> {
  @ContentChildren(TableTemplate) templates!: QueryList<TableTemplate<T>>;

  protected templateMap = new Map<string, TemplateRef<TableTemplateContext<T>>>();

  ngAfterContentInit() {
    this.templates.forEach((t) => {
      this.templateMap.set(t.name, t.template);
    });
  }

  protected _columns: TableColumn<T>[] = [];
  protected _paginatedResponse: PaginatedResponse<T> | null | undefined;
  protected _templateColumn: TableColumn<T> | undefined = undefined;
  protected _data: TableRow<T>[] = [];

  protected _actions: TableActions = {
    view: { enabled: false },
    edit: { enabled: false },
    delete: { enabled: false },
    create: { enabled: false },
  };

  protected _tableToolsButtons: TableToolsButtons = {
    filter: { enabled: false },
    columns: { enabled: false },
    export: { enabled: false },
    addItem: { enabled: false },
  };

  // Client-side filtering
  @Input() clientFilter: boolean = false;
  // Per-column dropdown filter (unique values from the currently loaded/rendered
  // rows only — no backend call). Independent of clientFilter, which also
  // reroutes the search bar to filter locally instead of emitting onSearch.
  @Input() columnFilter: boolean = false;
  private filterState = new TableFilterState<T>();
  protected openFilterField: string | null = null;
  protected filterValues: any[] = [];

  @ViewChild(TableColumnFilter) private columnFilterPanel!: TableColumnFilter;

  protected readonly isOpenFieldValueChecked = (value: any): boolean =>
    this.openFilterField != null && this.isValueChecked(this.openFilterField, value);

  @Input() footer: T[] = [];
  @Input() footerLabel: string = 'TOTALES';
  @Input() showPager: boolean = true;
  @Input() showSearch: boolean = true;
  @Input() searchPlaceholder: string = 'Buscar';

  private _originalColumns: TableColumn<T>[] = [];
  private _rawData: TableRow<T>[] = [];

  @Input() set data(dt: TableRow<T>[]) {
    this._rawData = dt ?? [];
    this.applyClientFilters();
  }

  @Input() set columns(cols: TableColumn<T>[]) {
    this._originalColumns = cols ?? [];
    this.buildColumns();
  }

  @Input() set actions(value: Partial<TableActions>) {
    (Object.keys(this._actions) as TableActionType[]).forEach((key) => {
      this._actions[key] = {
        ...this._actions[key],
        ...value?.[key],
      };
    });

    this.buildColumns();
  }

  @Input() set tableToolsButtons(btns: Partial<TableToolsButtons>) {
    this._tableToolsButtons = {
      ...this._tableToolsButtons,
      ...btns,
    };
  }

  @Input() set templateColumn(col: TableColumn<T>) {
    this._templateColumn = col;
    this.buildColumns();
  }

  @Input() set paginatedResponse(pr: PaginatedResponse<T> | null | undefined) {
    this._paginatedResponse = pr;
    if (this._paginatedResponse?.results) {
      this._rawData = this._paginatedResponse?.results.map((r) => {
        return { selected: false, obj: { ...r } };
      });
      this.applyClientFilters();
    }
  }

  @Output() onPagerChange = new EventEmitter<{ page: number; pageSize: number }>();

  @Output() onAction = new EventEmitter<TableActionEvent<T>>();

  @Output() onSearch = new EventEmitter<string>();

  readonly actionKeys: TableActionType[] = ['view', 'edit', 'delete'];

  get visibleColumnCount(): number {
    return this._columns.filter(c => !c.hidden).length;
  }

  get primaryColumn(): TableColumn<T> | undefined {
    return getPrimaryColumn(this._columns);
  }

  get mobileActionsColumn(): TableColumn<T> | undefined {
    return getMobileActionsColumn(this._columns);
  }

  get mobileSecondaryColumn(): TableColumn<T> | undefined {
    return getMobileSecondaryColumn(this._columns);
  }

  get detailColumns(): TableColumn<T>[] {
    return getDetailColumns(this._columns);
  }

  get footerSecondaryColumn(): TableColumn<T> | undefined {
    return getFooterSecondaryColumn(this._columns);
  }

  get footerDetailColumns(): TableColumn<T>[] {
    return getFooterDetailColumns(this._columns);
  }

  get totalItems(): number {
    return this._paginatedResponse?.count ?? 0;
  }

  get pageSize(): number {
    return this._paginatedResponse?.params?.limit ?? environment.DEFAULT_PAGE_SIZE;
  }

  get currentPage(): number {
    if (!this._paginatedResponse) return 1;

    const limit = this._paginatedResponse.params?.limit ?? this.pageSize;
    return this.offset / limit + 1;
  }

  get offset() {
    return this._paginatedResponse?.params?.offset ?? 0;
  }

  private buildColumns() {
    this._columns = buildTableColumns(this._originalColumns, this._actions);
    for (const col of this._columns) {
      if (col.field) this.filterState.setFormatter(col.field as string, col.filterFormat);
    }
    this.applyClientFilters();
  }

  private applyClientFilters(): void {
    this._data = this.filterState.apply(this._rawData, this.clientFilter, this.clientFilter || this.columnFilter);
  }

  protected isColumnFilterable(col: TableColumn<T>): boolean {
    return (this.clientFilter || this.columnFilter) && !!col.field && col.type !== 'tableActionType' && col.type !== 'index';
  }

  protected getFieldString(col: TableColumn<T>): string {
    return col.field as string;
  }

  protected isFilterActive(field: string): boolean {
    return this.filterState.isFilterActive(field);
  }

  protected isValueChecked(field: string, value: any): boolean {
    return this.filterState.isValueChecked(field, value);
  }

  protected toggleFilterValue(field: string, value: any): void {
    this.filterState.toggleFilterValue(field, value);
    this.applyClientFilters();
  }

  protected clearColumnFilter(field: string): void {
    this.filterState.clearFilter(field);
    this.applyClientFilters();
    this.columnFilterPanel.close();
  }

  protected toggleFilterDropdown(field: string, event: MouseEvent): void {
    event.stopPropagation();
    if (this.openFilterField === field) {
      this.columnFilterPanel.close();
      return;
    }
    this.openFilterField = field;
    this.filterValues = this.filterState.getUniqueValues(field, this._rawData);
    this.columnFilterPanel.open(event.currentTarget as HTMLElement);
  }

  protected onFilterPanelClosed(): void {
    this.openFilterField = null;
  }

  getAlignment(align?: string) {
    if (align == 'right') return 'text-right';
    if (align == 'center') return 'text-center';
    return 'text-left';
  }

  pagerHandler(value: any) {
    this.onPagerChange.emit(value);
  }

  searchHandler(value: string) {
    if (this.clientFilter) {
      this.filterState.setSearchTerm(value);
      this.applyClientFilters();
    } else {
      this.onSearch.emit(value);
    }
  }

  actionHandler(obj: T, type: TableActionType) {
    this.onAction.emit({ obj, type, action: this._actions[type] });
  }

  toolsHandler(type: TableToolsButtonType) {
    if (type == 'addItem') {
      const obj = {} as T;
      this.actionHandler(obj, 'create');
    }
  }
}
