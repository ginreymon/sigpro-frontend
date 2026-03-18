import { Directive, inject, Signal, signal, WritableSignal } from '@angular/core';
import { TableActions } from '../interfaces/table-actions';
import { toSignal } from '@angular/core/rxjs-interop';
import { BaseCrudService } from '../../services/common/base-crud-service';
import { TableColumn } from '../interfaces/table-column';
import { QueryParams } from '../interfaces/query-params';
import { finalize } from 'rxjs';
import { BaseEntity } from '../interfaces/base-entity';
import { TableToolsButtons } from '../interfaces/table-tools-buttons';
import { FormBuilder, FormGroup } from '@angular/forms';
import { AuditEntity } from '../interfaces/audit-entity';
import { ActionsCrudPage } from './actions-crud-page';

@Directive()
export abstract class BaseCrudPage<T extends BaseEntity> extends ActionsCrudPage<T> {
  protected modelForm!: FormGroup;
  protected showLoader = signal<boolean>(false);
  protected errorMessage = signal<string | null>(null);

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

  protected fb = inject(FormBuilder);

  protected modalVisible!: Signal<boolean>;
  protected sideModalVisible!: Signal<boolean>;
  protected confirmVisible!: Signal<boolean>;
  protected toastVisible!: Signal<boolean>;

  protected columns: TableColumn<T>[] = [];

  constructor(protected override crudService: BaseCrudService<T>) {
    super(crudService);
    this.modalVisible = toSignal(this.dialogService.modalVisible$, { initialValue: false });
    this.sideModalVisible = toSignal(this.dialogService.sideModalVisible$, { initialValue: false });
    this.confirmVisible = toSignal(this.dialogService.confirmVisible$, { initialValue: false });
    this.toastVisible = toSignal(this.dialogService.toastVisible$, { initialValue: false });   
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
      return this.dialogService.confirmCallback() ?? (() => {});
    }
    return () => {};
  }

  protected initializeColumns() {
    this.columns = [];
  }

  protected initializeModelForm() {
    this.modelForm = this.fb.group({});
  }

  protected validateModelForm(): boolean {
    this.modelForm.markAllAsTouched();
    Object.keys(this.modelForm.controls).forEach((key) => {
      const control = this.modelForm.get(key);
      control?.updateValueAndValidity({ onlySelf: true, emitEvent: true });
    });
    return this.modelForm.valid;
  }

  protected closeModelForm() {
    this.modelForm.reset();
    this.errorMessage.set(null);
    this.dialogService.closeModal();
  }

  override resetModalForm(): void {
    this.initializeModelForm();
  }

  protected submit(model?: Partial<T>, callback?: () => void) {
    if (!this.validateModelForm()) return;
    this.showLoader.set(true);
    const payload: Partial<T> = model ? model : this.modelForm.value;

    const request$ =
      this.actionType == 'create'
        ? this.crudService.create(payload)
        : this.crudService.update(this.rowObject.id!, payload);

    request$.pipe(finalize(() => this.reload(() => this.showLoader.set(false)))).subscribe({
      next: () => {
        callback?.();
        this.closeModelForm();
      },
      error: (err) => {
        this.errorMessage.set('Ocurrió un error. Intente nuevamente.');
      },
    });
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
