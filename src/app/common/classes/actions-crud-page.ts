import { inject } from '@angular/core';
import { DialogService } from '../../services/common/dialog-service';
import { BaseEntity } from '../interfaces/base-entity';
import { TableActionEvent } from '../interfaces/table-action-event';
import { TableActionType } from '../interfaces/table-actions';
import { PaginatedCrudPage } from './paginated-crud-page';

export abstract class ActionsCrudPage<T extends BaseEntity> extends PaginatedCrudPage<T> {
  protected displayFields: (keyof T)[] = [];
  protected rowObject: Partial<T> = {};
  protected actionType: TableActionType | null | undefined = null;
  protected dialogService = inject(DialogService);

  abstract prepareFormForAction(): void;

  get displayValue(): string {
    if (!this.displayFields.length) return '';

    return this.displayFields
      .map((field) => this.rowObject[field])
      .filter((v) => v != null)
      .join(' ');
  }

  protected actionHandler(event: TableActionEvent<T>) {
    this.ensureDisplayField(event.obj);
    this.rowObject = event.obj;
    this.actionType = null;
    this.prepareFormForAction();

    if (event.type == 'view') {
      this.actionType = event.type;
      this.dialogService.openSideModal(event.action.title, 'Cerrar');
    }

    if (event.type == 'create' || event.type == 'edit') {
      this.actionType = event.type;
      const acceptLabel = event.type == 'create' ? 'Guardar' : 'Actualizar';
      this.dialogService.openModal(event.action.title, acceptLabel);
    }

    if (event.type == 'delete') {
      this.actionType = event.type;
      const title = event.action.title ?? 'Eliminar';
      const value = this.displayValue?.trim();
      const label = value ? `"${value}"` : 'el registro';
      const message = `¿Está seguro de que desea eliminar${value ? ' ' + value : ''}?`;
      this.dialogService.openConfirm(title, message, 'Eliminar', () => {
        this.dialogService.closeConfirm();
        this.deleteHandler(event.obj.id,
          () => {
            this.dialogService.openToast('Eliminado', `${label} fue eliminado correctamente.`, 'check');
          },
          () => {
            this.dialogService.openToast('Aviso', `${label} no pudo ser eliminado.`, 'fail');
          }
        );
      });
    }
  }

  protected deleteHandler(id: number, callback?: () => void, errorCallback?: () => void) {
    this.crudService.delete(id).subscribe({
      next: () => {
        const current = this.paginatedResponse();

        if (!current) return;

        const filtered = current.results.filter((r) => r?.id !== id);

        this.paginatedResponse.set({
          ...current,
          results: filtered,
          count: current.count - 1,
        });

        callback?.();
      },
      error: (err) => errorCallback?.(),
    },
    );
  }

  protected ensureDisplayField(obj: T) {
    const candidates = ['name', 'first_name', 'title', 'label', 'description', 'identification', 'engineering_code'];
    for (const key of candidates) {
      if (key in obj) {
        this.displayFields = [key as keyof T];
        break;
      }
    }
  }
}
