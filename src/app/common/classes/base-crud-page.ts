import { Directive, inject, Signal, signal } from '@angular/core';
import { environment } from '../../../environments/environment';
import { PaginatedResponse } from '../interfaces/paginated-response';
import { TableActions, TableActionType } from '../interfaces/table-actions';
import { WorkSpaceLoaderService } from '../../services/common/work-space-loader-service';
import { DialogService } from '../../services/common/dialog-service';
import { toSignal } from '@angular/core/rxjs-interop';
import { BaseCrudService } from '../../services/common/base-crud-service';
import { TableColumn } from '../interfaces/table-column';
import { QueryParams } from '../interfaces/query-params';
import { finalize } from 'rxjs';
import { BaseEntity } from '../interfaces/base-entity';
import { TableToolsButtons } from '../interfaces/table-tools-buttons';
import { FormBuilder, FormGroup } from '@angular/forms';
import { TableActionEvent } from '../interfaces/table-action-event';

@Directive()
export abstract class BaseCrudPage<T extends BaseEntity> {
  protected limit: number = environment.DEFAULT_PAGE_SIZE;
  protected page: number = 1;
  protected searchTerm: string = '';
  protected modelForm!: FormGroup;
  protected showLoader = signal<boolean>(false);
  protected errorMessage = signal<string | null>(null);
  protected rowObject: Partial<T> = {};
  protected actionType: TableActionType | null | undefined = null;

  protected paginatedResponse = signal<PaginatedResponse<T> | null>(null);

  protected actions: TableActions = {
    view: { enabled: false },
    edit: { enabled: false },
    delete: { enabled: false },
    create: { enabled: false },
  };

  protected tableToolsButtons: TableToolsButtons = {
    filter: { enabled: false },
    columns: { enabled: false },
    export: { enabled: false },
    addItem: { enabled: false },
  };

  protected wslService = inject(WorkSpaceLoaderService);
  protected dialogService = inject(DialogService);
  protected fb = inject(FormBuilder);

  protected modalVisible!: Signal<boolean>;
  protected sideModalVisible!: Signal<boolean>;
  protected confirmVisible!: Signal<boolean>;
  protected toastVisible!: Signal<boolean>;

  protected columns: TableColumn<T>[] = [];

  get title() {
    return this.dialogService.title;
  }
  get message() {
    return this.dialogService.message;
  }
  get confirmCallback(): () => void {
    if (this.dialogService.confirmCallback) {
      return this.dialogService.confirmCallback() ?? (() => {});
    }
    return () => {};
  }
  constructor(protected crudService: BaseCrudService<T>) {
    this.modalVisible = toSignal(this.dialogService.modalVisible$, { initialValue: false });
    this.sideModalVisible = toSignal(this.dialogService.sideModalVisible$, { initialValue: false });
    this.confirmVisible = toSignal(this.dialogService.confirmVisible$, { initialValue: false });
    this.toastVisible = toSignal(this.dialogService.toastVisible$, { initialValue: false });
    this.page = 1;
    this.searchTerm = '';
    this.reload();
    this.initializeColumns();
    this.initializeModelForm();
  }

  protected initializeColumns() {
    this.columns = [];
  }

  protected initializeModelForm() {
    this.modelForm = this.fb.group({});
  }

  protected getData(params: QueryParams, callback?: () => void) {
    this.wslService.start();
    this.crudService
      .getAll(params)
      .pipe(finalize(() => this.wslService.end()))
      .subscribe({
        next: (res) => this.paginatedResponse.set(res),
        complete: () => callback?.(),
      });
  }

  protected validateModelForm():boolean {
    this.modelForm.markAllAsTouched();
    Object.keys(this.modelForm.controls).forEach((key) => {
      const control = this.modelForm.get(key);
      control?.updateValueAndValidity({ onlySelf: true, emitEvent: true });
    });
    return this.modelForm.valid;
  }

  protected reload(callback?: () => void) {
    const offset = (this.page - 1) * this.limit;

    const params: QueryParams = {
      limit: this.limit,
      offset,
      search: this.searchTerm || undefined,
    };

    this.getData(params, callback);
  }

  protected searchHandler(value: string) {
    this.searchTerm = value;
    this.page = 1;
    const params: QueryParams = {
      limit: this.limit,
      offset: 0,
      search: this.searchTerm,
    };
    this.getData(params);
  }

  protected actionHandler(event: TableActionEvent<T>) {
    this.rowObject = event.obj;
    this.actionType = null;
    
    if (event.type == 'view') {
      this.actionType = event.type;
      this.dialogService.openSideModal(event.action.title);
    }

    if (event.type == 'create' || event.type == 'edit') {
      this.actionType = event.type;      
      this.dialogService.openModal(event.action.title);
      this.initializeModelForm();
    }

    if (event.type == 'delete') {
      this.actionType = event.type; 
      const title = event.action.title ?? 'Eliminar';
      const message = '¿Está seguro de que desea eliminar?';
      this.dialogService.openConfirm(title, message, () => {
        this.deleteHandler(event.obj.id, () => {
          this.dialogService.closeConfirm();
        });
      });
    }
  }

  protected deleteHandler(id: number, callback?: () => void) {
    this.crudService.delete(id).subscribe(() => {
      const current = this.paginatedResponse();

      if (!current) return;

      const filtered = current.results.filter((r) => r?.id !== id);

      this.paginatedResponse.set({
        ...current,
        results: filtered,
        count: current.count - 1,
      });

      callback?.();
    });
  }

  protected pagerHandler(value: { page: number; pageSize: number }) {
    if (value?.page != this.page) {
      this.page = value.page;
    }

    if (this.limit != value?.pageSize) {
      this.limit = value.pageSize;
      this.page = 1;
    }

    const offset = (this.page - 1) * this.limit;
    const params: QueryParams = {
      limit: this.limit,
      offset,
      search: this.searchTerm || undefined,
    };
    this.getData(params);
  }

  protected closeModelForm() {
    this.modelForm.reset();
    this.errorMessage.set(null);
    this.dialogService.closeModal();
  }

  protected submit() {
    this.validateModelForm();
  }
}
