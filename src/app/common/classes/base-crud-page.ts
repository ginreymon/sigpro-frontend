import { Directive, inject, Signal, signal, WritableSignal } from '@angular/core';
import { environment } from '../../../environments/environment';
import { PaginatedResponse } from '../interfaces/paginated-response';
import { TableActions, TableActionType } from '../interfaces/table-actions';
import { WorkSpaceLoaderService } from '../../services/common/work-space-loader-service';
import { DialogService } from '../../services/common/dialog-service';
import { toSignal } from '@angular/core/rxjs-interop';
import { BaseCrudService } from '../../services/common/base-crud-service';
import { TableColumn } from '../interfaces/table-column';
import { QueryParams } from '../interfaces/query-params';
import { finalize, map } from 'rxjs';
import { BaseEntity } from '../interfaces/base-entity';
import { TableToolsButtons } from '../interfaces/table-tools-buttons';
import { FormBuilder, FormGroup } from '@angular/forms';
import { TableActionEvent } from '../interfaces/table-action-event';
import { AuditEntity } from '../interfaces/audit-entity';

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
  protected displayFields: (keyof T)[] = [];

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

  get title() {
    return this.dialogService.title;
  }

  get message() {
    return this.dialogService.message;
  }

  get acceptLabel() {
    return this.dialogService.acceptLabel;
  }

  get confirmCallback(): () => void {
    if (this.dialogService.confirmCallback) {
      return this.dialogService.confirmCallback() ?? (() => { });
    }
    return () => { };
  }

  get displayValue(): string {
    if (!this.displayFields.length) return '';

    return this.displayFields
      .map(field => this.rowObject[field])
      .filter(v => v != null)
      .join(' ');
  }

  protected initializeColumns() {
    this.columns = [];
  }

  protected initializeModelForm() {
    this.modelForm = this.fb.group({});
  }

  protected mapResponse(res: PaginatedResponse<T>): PaginatedResponse<T> {
    return { ...res };
  }

  protected getData(params: QueryParams, callback?: () => void) {
    this.wslService.start();
    this.crudService
      .getAll(params)
      .pipe(
        map((res) => this.mapResponse(res)),
        finalize(() => this.wslService.end()),
      )
      .subscribe({
        next: (res) => this.paginatedResponse.set(res),
        complete: () => callback?.(),
      });
  }

  protected validateModelForm(): boolean {
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
    this.ensureDisplayField(event.obj);
    this.rowObject = event.obj;
    this.actionType = null;

    if (event.type == 'view') {
      this.actionType = event.type;
      this.dialogService.openSideModal(event.action.title, 'Cerrar');
    }

    if (event.type == 'create' || event.type == 'edit') {
      this.actionType = event.type;
      this.dialogService.openModal(event.action.title);
      const acceptLabel = event.type == 'create' ? 'Guardar' : 'Actualizar';
      this.dialogService.openModal(event.action.title, acceptLabel);
      this.initializeModelForm();
    }

    if (event.type == 'delete') {
      this.actionType = event.type;
      const title = event.action.title ?? 'Eliminar';
      const value = this.displayValue?.trim();
      const message = `¿Está seguro de que desea eliminar${value ? ' ' + value : ''}?`;
      this.dialogService.openConfirm(title, message, 'Eliminar', () => {
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

  protected ensureDisplayField(obj: T) {
    const candidates = ['name', 'first_name' ,'title', 'label', 'description'];

    for (const key of candidates) {
      if (key in obj) {
        this.displayFields = [key as keyof T];
        break;
      }
    }
  }

  protected loadList<E extends Partial<AuditEntity>>(service: BaseCrudService<E>, entitiesSignal: WritableSignal<E[]>, filter = false, transform?: (items: E[]) => E[]) {
    this.wslService.start();
    const params: QueryParams = { page: 1, limit: 1000000 };
    service
      .getAll(params)
      .pipe(finalize(() => this.wslService.end()))
      .subscribe((resp) => {
        let entities = filter
          ? resp.results.filter((e) => (e?.is_active ?? true) && !e?.is_deleted)
          : resp.results;

        entitiesSignal.set(transform ? transform(entities) : entities);
      });
  }
}
