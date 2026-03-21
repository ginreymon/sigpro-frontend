import { Component, ContentChildren, EventEmitter, Input, Output, QueryList, TemplateRef,} from '@angular/core';
import { TableColumn } from '../../../common/interfaces/table-column';
import { TablePager } from '../table-pager/table-pager';
import { PaginatedResponse } from '../../../common/interfaces/paginated-response';
import { TableTools } from '../table-tools/table-tools';
import { environment } from '../../../../environments/environment.development';
import { UiIcon } from '../../elements/ui-icon/ui-icon';
import { UiTooltip } from '../../elements/ui-tooltip/ui-tooltip';
import { TableRow } from '../../../common/interfaces/table-row';
import { TableActions, TableActionType } from '../../../common/interfaces/table-actions';
import { NgTemplateOutlet } from '@angular/common';
import { UiCheckbox } from '../../elements/ui-checkbox/ui-checkbox';
import { FormsModule } from '@angular/forms';
import { TableTemplate } from '../../../directives/table-template';
import { TableToolsButtons, TableToolsButtonType } from '../../../common/interfaces/table-tools-buttons';
import { TableActionEvent } from '../../../common/interfaces/table-action-event';
import { UiIconStateDirective } from "../../../directives/ui-icon-state-directive";

@Component({
  selector: 'app-data-table',
  imports: [TablePager, TableTools, UiIcon, UiTooltip, NgTemplateOutlet, UiCheckbox, FormsModule, UiIconStateDirective],
  templateUrl: './data-table.html',
  styleUrl: './data-table.css',
})
export class DataTable<T> {
  @ContentChildren(TableTemplate) templates!: QueryList<TableTemplate>;

  protected templateMap = new Map<string, TemplateRef<any>>();

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
    edit: { enabled: false },
    delete: { enabled: false },
    view: { enabled: false },
    create: { enabled: false },
  };

  protected _tableToolsButtons: TableToolsButtons = {
    filter: { enabled: false },
    columns: { enabled: false },
    export: { enabled: false },
    addItem: { enabled: false },
  };

  @Input() footer: T[] = [];

  private _originalColumns: TableColumn<T>[] = [];
  private _rawData: TableRow<T>[] = [];

  @Input() set data(dt: TableRow<T>[]) {
    this._rawData = dt ?? [];
    this._data = [...this._rawData];
  }

  @Input() set columns(cols: TableColumn<T>[]) {
    this._originalColumns = cols ?? [];
    this.buildColumns();
  }

  @Input() set actions(value: Partial<TableActions>) {
    this._actions = {
      ...this._actions,
      ...value,
    };
    this.buildColumns();
  }

  @Input() set tableToolsButtons(btns: TableToolsButtons) {
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
      this._data = [...this._rawData];
    }
  }

  @Output() onPagerChange = new EventEmitter<{ page: number; pageSize: number }>();

  @Output() onAction = new EventEmitter<TableActionEvent<T>>();
  
  @Output() onSearch = new EventEmitter<string>();

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

  getAlignment(align?: string) {
    if (align == 'right') return 'text-right';
    if (align == 'center') return 'text-center';
    return 'text-left';
  }

  pagerHandler(value: any) {
    this.onPagerChange.emit(value);
  }

  searchHandler(value: string) {
    this.onSearch.emit(value);
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
