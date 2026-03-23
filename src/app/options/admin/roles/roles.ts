import { Component, signal } from '@angular/core';
import { WorkSpaceLayout } from '../../../layouts/work-space-layout/work-space-layout';
import { BaseCrudPage } from '../../../common/classes/base-crud-page';
import { Role } from '../../../models/user/role';
import { RoleService } from '../../../services/user/role-service';
import { DataTable } from '../../../shared/components/data-table/data-table';
import { SideModalLayout } from '../../../shared/components/side-modal-layout/side-modal-layout';
import { ModalLayout } from '../../../shared/components/modal-layout/modal-layout';
import { UiInput } from '../../../shared/elements/ui-input/ui-input';
import { OptionsService } from '../../../services/core/options-service';
import { ReactiveFormsModule, Validators } from '@angular/forms';
import { Option } from '../../../models/core/option';
import { UiFormField } from '../../../shared/elements/ui-form-field/ui-form-field';
import { Loader } from '../../../shared/elements/loader/loader';
import { UiErrorMessage } from '../../../shared/elements/ui-error-message/ui-error-message';
import { UiOptionCard } from '../../../shared/elements/ui-option-card/ui-option-card';
import { UiBadge } from '../../../shared/elements/ui-badge/ui-badge';
import { minArrayLength } from '../../../common/functions/min-array-length';
import { TableActionEvent } from '../../../common/interfaces/table-action-event';
import { CharSquare } from "../../../shared/components/char-square/char-square";
import { Metadata } from '../../../shared/components/metadata/metadata';
import { TableColumn } from '../../../common/interfaces/table-column';

@Component({
  selector: 'app-roles',
  imports: [
    WorkSpaceLayout,
    DataTable,   
    SideModalLayout,
    ModalLayout,
    UiInput,
    ReactiveFormsModule,
    UiFormField,
    Loader,
    UiErrorMessage,
    UiOptionCard,
    UiBadge,
    CharSquare,
    Metadata
  ],
  templateUrl: './roles.html',
  styleUrl: './roles.css',
})
export class Roles extends BaseCrudPage<Role> { 
  options = signal<Option[]>([]);

  constructor(
    private roleService: RoleService,
    private optionService: OptionsService,
  ) {
    super(roleService);
    this.actions.edit = { enabled: true, title: 'Editar rol' };
    this.actions.view = { enabled: true, title: 'Ver rol' };
    this.actions.delete = { enabled: true, title: 'Eliminar rol' };
    this.actions.create = { enabled: true, title: 'Crear rol' };
    this.tableToolsButtons.addItem.enabled = true;
    this.loadList(this.optionService, this.options, true);
  }

  protected override get columns(): TableColumn<Role>[] {
    return [{ field: 'name', label: 'Nombre' }];
  }

  protected override initializeModelForm(): void {
    this.modelForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      option_ids: this.fb.control<number[]>([], [minArrayLength(1)]),
    });
  }

  protected override actionHandler(event: TableActionEvent<Role>): void {
    super.actionHandler(event);
    if (event.type == 'edit') {
      this.modelForm.patchValue(event.obj);
      const ids = event.obj.options.map((op) => {
        return op.id;
      });
      this.optionIds?.setValue([...ids]);
    }
  }

  get name() {
    return this.modelForm?.get('name');
  }

  get optionIds() {
    return this.modelForm?.get('option_ids');
  }

  toggleOption(id: number) {
    const current = this.optionIds?.value ?? [];
    if (current.includes(id)) {
      this.optionIds?.setValue(current.filter((x: number) => x !== id));
    } else {
      this.optionIds?.setValue([...current, id]);
    }
  }

  isSelected(id: number) {
    return this.optionIds?.value?.includes(id);
  }
}
