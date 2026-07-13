import { Component, ContentChildren, EventEmitter, Input, Output, QueryList, TemplateRef, } from '@angular/core';
import { TableColumn } from '../../../common/interfaces/table-column';
import { TablePager } from '../table-pager/table-pager';
import { PaginatedResponse } from '../../../common/interfaces/paginated-response';
import { TableTools } from '../table-tools/table-tools';
import { environment } from '../../../../environments/environment.development';
import { UiIcon } from '../../elements/ui-icon/ui-icon';
import { UiTooltip } from '../../elements/ui-tooltip/ui-tooltip';
import { TableRow } from '../../../common/interfaces/table-row';
import { TableActions, TableActionType } from '../../../common/interfaces/table-actions';
import { NgTemplateOutlet, DecimalPipe } from '@angular/common';
import { UiCheckbox } from '../../elements/ui-checkbox/ui-checkbox';
import { FormsModule } from '@angular/forms';
import { TableTemplate, TableTemplateContext } from '../../../directives/table-template';
import { TableToolsButtons, TableToolsButtonType } from '../../../common/interfaces/table-tools-buttons';
import { TableActionEvent } from '../../../common/interfaces/table-action-event';
import { UiIconStateDirective } from "../../../directives/ui-icon-state-directive";

@Component({
  selector: 'app-data-table',
  imports: [TablePager, TableTools, UiIcon, UiTooltip, NgTemplateOutlet, UiCheckbox, FormsModule, UiIconStateDirective, DecimalPipe],
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
  protected activeFilters = new Map<string, Set<any>>();
  protected openFilterField: string | null = null;
  protected filterDropdownPosition = { top: 0, left: 0 };
  protected filterUniqueValues: any[] = [];
  private currentSearchTerm: string = '';

  @Input() footer: T[] = [];
  @Input() showPager: boolean = true;
  @Input() showSearch: boolean = true;

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
    return this._columns.find(
      (c) => !c.hidden && c.field && c.type !== 'tableActionType' && c.type !== 'index',
    );
  }

  get mobileActionsColumn(): TableColumn<T> | undefined {
    return this._columns.find((c) => !c.hidden && c.type === 'tableActionType');
  }

  get detailColumns(): TableColumn<T>[] {
    const primary = this.primaryColumn;
    return this._columns.filter(
      (c) => !c.hidden && c.type !== 'index' && c.type !== 'tableActionType' && c !== primary,
    );
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
    const columns: TableColumn<T>[] = [{ type: 'index', label: '' }, ...this._originalColumns];

    if (this._actions.delete || this._actions.edit || this._actions.view) {
      columns.push({ type: 'tableActionType', label: '' });
    }

    this._columns = columns.map((col, i) => ({
      ...col,
      align: col.align ?? (i == columns.length - 1 ? 'right' : 'left'),
      hidden: col.hidden ?? false,
      order: col.order ?? i,
      classes: col.classes ?? '',
    }));
  }

  private applyClientFilters(): void {
    if (!this.clientFilter) {
      this._data = [...this._rawData];
      return;
    }

    let filtered = this._rawData;

    const term = this.currentSearchTerm.toLowerCase().trim();
    if (term) {
      filtered = filtered.filter(row =>
        Object.values(row.obj as object).some(v =>
          String(v ?? '').toLowerCase().includes(term)
        )
      );
    }

    for (const [field, values] of this.activeFilters) {
      if (values.size > 0) {
        filtered = filtered.filter(row => values.has((row.obj as any)[field]));
      }
    }

    this._data = filtered;
  }

  protected isColumnFilterable(col: TableColumn<T>): boolean {
    return this.clientFilter && !!col.field && col.type !== 'tableActionType' && col.type !== 'index';
  }

  protected getFieldString(col: TableColumn<T>): string {
    return col.field as string;
  }

  protected getUniqueValues(field: string): any[] {
    const seen = new Set<any>();
    const result: any[] = [];
    for (const row of this._rawData) {
      const val = (row.obj as any)[field];
      if (!seen.has(val)) {
        seen.add(val);
        result.push(val);
      }
    }
    return result.sort((a, b) => {
      if (a == null) return 1;
      if (b == null) return -1;
      return String(a).localeCompare(String(b), undefined, { numeric: true });
    });
  }

  protected isFilterActive(field: string): boolean {
    return (this.activeFilters.get(field)?.size ?? 0) > 0;
  }

  protected isValueChecked(field: string, value: any): boolean {
    return this.activeFilters.get(field)?.has(value) ?? false;
  }

  protected toggleFilterValue(field: string, value: any): void {
    if (!this.activeFilters.has(field)) {
      this.activeFilters.set(field, new Set());
    }
    const vals = this.activeFilters.get(field)!;
    if (vals.has(value)) vals.delete(value);
    else vals.add(value);
    if (vals.size === 0) this.activeFilters.delete(field);
    this.applyClientFilters();
  }

  protected clearColumnFilter(field: string): void {
    this.activeFilters.delete(field);
    this.openFilterField = null;
    this.applyClientFilters();
  }

  protected toggleFilterDropdown(field: string, event: MouseEvent): void {
    event.stopPropagation();
    if (this.openFilterField === field) {
      this.openFilterField = null;
      return;
    }
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const dropdownWidth = 200;
    let left = rect.left;
    if (left + dropdownWidth > window.innerWidth - 8) {
      left = window.innerWidth - dropdownWidth - 8;
    }
    this.filterDropdownPosition = { top: rect.bottom + 4, left: Math.max(8, left) };
    this.filterUniqueValues = this.getUniqueValues(field);
    this.openFilterField = field;
  }

  protected closeFilterDropdown(): void {
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
      this.currentSearchTerm = value;
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
