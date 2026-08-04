import { Component, signal } from '@angular/core';
import { finalize } from 'rxjs';
import { WorkSpaceLayout } from '../../../layouts/work-space-layout/work-space-layout';
import { BaseCrudPage } from '../../../common/classes/base-crud-page';
import { Role } from '../../../models/user/role';
import { RoleService } from '../../../services/user/role-service';
import { DataTable } from '../../../shared/components/table/data-table/data-table';
import { SideModalLayout } from '../../../shared/components/layout/side-modal-layout/side-modal-layout';
import { ModalLayout } from '../../../shared/components/layout/modal-layout/modal-layout';
import { UiInput } from '../../../shared/elements/ui-input/ui-input';
import { MenuModuleService } from '../../../services/core/menu-module-service';
import { ReactiveFormsModule, Validators } from '@angular/forms';
import { Module } from '../../../models/core/module';
import { UiFormField } from '../../../shared/elements/ui-form-field/ui-form-field';
import { UiErrorMessage } from '../../../shared/elements/ui-error-message/ui-error-message';
import { UiOptionCard } from '../../../shared/elements/ui-option-card/ui-option-card';
import { UiBadge } from '../../../shared/elements/ui-badge/ui-badge';
import { UiAccordionItem } from '../../../shared/elements/ui-accordion-item/ui-accordion-item';
import { TableTemplate } from '../../../directives/table-template';
import { minArrayLength } from '../../../common/functions/min-array-length';
import { TableActionEvent } from '../../../common/interfaces/table-action-event';
import { CharSquare } from "../../../shared/components/widgets/char-square/char-square";
import { Metadata } from '../../../shared/components/widgets/metadata/metadata';
import { TableColumn } from '../../../common/interfaces/table-column';
import { TitleCasePipe } from '@angular/common';

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
    UiErrorMessage,
    UiOptionCard,
    UiBadge,
    UiAccordionItem,
    TableTemplate,
    CharSquare,
    Metadata,
    TitleCasePipe
  ],
  templateUrl: './roles.html',
  styleUrl: './roles.css',
})
export class Roles extends BaseCrudPage<Role> {
  protected override entityName: string = 'rol';
  modules = signal<Module[]>([]);
  expandedOptionIds = signal<Set<number>>(new Set());

  constructor(private roleService: RoleService, private moduleService: MenuModuleService) {
    super(roleService);
    this.loadModules();
  }

  private loadModules(): void {
    this.wslService.start();
    this.moduleService
      .withOptions()
      .pipe(finalize(() => this.wslService.end()))
      .subscribe((modules) => this.modules.set(modules));
  }

  protected override get columns(): TableColumn<Role>[] {
    return [
      { field: 'name', label: 'Nombre' },
      { type: 'template', label: 'Opciones/Páginas', templateName: 'optionsCountTemplate' },
      { field: 'user_count', label: 'Usuarios' },
    ];
  }

  expandedModuleIds = signal<Set<number>>(new Set());

  protected override closeModelForm(): void {
    this.expandedOptionIds.set(new Set());
    this.expandedModuleIds.set(new Set());
    super.closeModelForm();
  }

  isOptionExpanded(id: number): boolean {
    return this.expandedOptionIds().has(id);
  }

  toggleOptionExpanded(id: number): void {
    const expanded = new Set(this.expandedOptionIds());
    if (expanded.has(id)) {
      expanded.delete(id);
    } else {
      expanded.add(id);
    }
    this.expandedOptionIds.set(expanded);
  }

  isModuleExpanded(id: number): boolean {
    return this.expandedModuleIds().has(id);
  }

  toggleModuleExpanded(id: number): void {
    const expanded = new Set(this.expandedModuleIds());
    if (expanded.has(id)) {
      expanded.delete(id);
    } else {
      expanded.add(id);
    }
    this.expandedModuleIds.set(expanded);
  }

  selectedOptionCount(module: Module): number {
    const selected: number[] = this.optionIds?.value ?? [];
    return (module.options ?? []).filter((o) => selected.includes(o.id)).length;
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
