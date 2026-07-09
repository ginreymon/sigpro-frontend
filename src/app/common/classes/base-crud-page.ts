import { Directive, inject, signal, WritableSignal } from '@angular/core';
import { TableActions } from '../interfaces/table-actions';
import { BaseCrudService } from '../../services/common/base-crud-service';
import { TableColumn } from '../interfaces/table-column';
import { finalize } from 'rxjs';
import { BaseEntity } from '../interfaces/base-entity';
import { TableToolsButtons } from '../interfaces/table-tools-buttons';
import { FormBuilder, FormGroup } from '@angular/forms';
import { AuditEntity } from '../interfaces/audit-entity';
import { ActionsCrudPage } from './actions-crud-page';
import { LoaderService } from '../../services/common/loader-service';

@Directive()
export abstract class BaseCrudPage<T extends BaseEntity> extends ActionsCrudPage<T> {
  protected modelForm!: FormGroup;
  protected errorMessage = signal<string | null>(null);
  protected abstract entityName: string;

  protected get actions(): TableActions {
    return {
      view: { enabled: true, title: `Ver ${this.entityName}`, iconName: 'eye', toolTip: 'Ver' },
      edit: { enabled: true, title: `Editar ${this.entityName}`, iconName: 'pencil', toolTip: 'Editar' },
      delete: { enabled: true, title: `Eliminar ${this.entityName}`, iconName: 'trash', toolTip: 'Eliminar' },
      create: { enabled: true, title: `Crear ${this.entityName}`, },
    };
  }

  protected tableToolsButtons: TableToolsButtons = {
    filter: { enabled: false },
    columns: { enabled: false },
    export: { enabled: false },
    addItem: { enabled: true },
  };

  protected fb = inject(FormBuilder);
  protected loaderService = inject(LoaderService);

  constructor(protected override crudService: BaseCrudService<T>) {
    super(crudService);
    this.initializeModelForm();
  }

  protected showLoader(){
    return this.loaderService.loaderVisible();
  } 

  protected get columns(): TableColumn<T>[] {
    return [];
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

  override prepareFormForAction(): void {
    this.initializeModelForm();
  }

  protected submit(model?: Partial<T>, callback?: () => void, errorCallback?: (err: any) => void) {
    if (!this.validateModelForm()) return;
    this.loaderService.showLoader();
    const payload: Partial<T> = model ? model : this.modelForm.value;

    const request$ =
      this.actionType == 'create'
        ? this.crudService.create(payload)
        : this.crudService.update(this.rowObject.id!, payload);

    request$.pipe(finalize(() => this.reload(() => this.loaderService.hideLoader()))).subscribe({
      next: () => {
        callback?.();
        this.closeModelForm();
        const actionText = this.actionType === 'create' ? 'creado' : 'actualizado';
        this.dialogService.openToast('Proceso exitoso', `El registro fue ${actionText} correctamente.`, 'check');
      },
      error: (err) => {
        this.loaderService.hideLoader();
        if (errorCallback) {
          errorCallback(err);
          return;
        }
        const hasFieldErrors = this.markServerFieldErrors(err);
        this.errorMessage.set(
          hasFieldErrors
            ? 'Uno o varios campos tienen errores. Revisa los campos marcados.'
            : 'Ocurrió un error. Intente nuevamente.',
        );
      },
    });
  }

  private markServerFieldErrors(err: any): boolean {
    const body = err?.error;
    if (err?.status !== 400 || !body || typeof body !== 'object') return false;

    let matched = false;
    Object.keys(body).forEach((key) => {
      const control = this.modelForm?.get(key);
      if (!control) return;
      const fieldError = body[key];
      const message = Array.isArray(fieldError) ? fieldError.join(' ') : String(fieldError);
      control.setErrors({ serverError: message });
      control.markAsTouched();
      matched = true;
    });
    return matched;
  }

  protected loadList<E extends Partial<AuditEntity>>(service: BaseCrudService<E>, entitiesSignal: WritableSignal<E[]>, filter = false, transform?: (items: E[]) => E[]) {
    this.wslService.start();
    service
      .all()
      .pipe(finalize(() => this.wslService.end()))
      .subscribe((entities) => {
        if (filter) entities = entities.filter((e) => (e?.is_active ?? true) && !e?.is_deleted);
        entitiesSignal.set(transform ? transform(entities) : entities);
      });
  }
}
