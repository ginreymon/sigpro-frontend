import { Component, computed, signal } from '@angular/core';
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
import { HomeViewService } from '../../../services/core/home-view-service';
import { HomeView } from '../../../models/core/home-view';
import { UiSelect } from '../../../shared/elements/ui-select/ui-select';
import { ReactiveFormsModule, Validators } from '@angular/forms';
import { Module } from '../../../models/core/module';
import { UiFormField } from '../../../shared/elements/ui-form-field/ui-form-field';
import { UiErrorMessage } from '../../../shared/elements/ui-error-message/ui-error-message';
import { UiTree, UiTreeId, UiTreeNode } from '../../../shared/elements/ui-tree/ui-tree';
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
    UiTree,
    UiBadge,
    UiAccordionItem,
    TableTemplate,
    CharSquare,
    Metadata,
    TitleCasePipe,
    UiSelect
  ],
  templateUrl: './roles.html',
  styleUrl: './roles.css',
})
export class Roles extends BaseCrudPage<Role> {
  protected override entityName: string = 'rol';
  modules = signal<Module[]>([]);
  homeViews = signal<HomeView[]>([]);
  private titleCase = new TitleCasePipe();
  expandedOptionIds = signal<Set<number>>(new Set());

  constructor(
    private roleService: RoleService,
    private moduleService: MenuModuleService,
    private homeViewService: HomeViewService,
  ) {
    super(roleService);
    this.loadModules();
    this.loadHomeViews();
  }

  private loadModules(): void {
    this.wslService.start();
    this.moduleService
      .withOptions()
      .pipe(finalize(() => this.wslService.end()))
      .subscribe((modules) => this.modules.set(modules));
  }

  private loadHomeViews(): void {
    this.homeViewService.all({ is_active: 1 }).subscribe((homeViews) => this.homeViews.set(homeViews));
  }

  protected override get columns(): TableColumn<Role>[] {
    return [
      { field: 'name', label: 'Nombre' },
      { type: 'template', label: 'Opciones/Páginas', templateName: 'optionsCountTemplate' },
      { type: 'template', label: 'Vista de inicio', templateName: 'homeViewTemplate' },
      { field: 'user_count', label: 'Usuarios' },
      { type: 'template', label: 'Estado', templateName: 'statusTemplate' },
    ];
  }

  /** Module -> option tree; module ids are prefixed so they never collide with option ids. */
  optionTree = computed<UiTreeNode[]>(() =>
    this.modules()
      .filter((module) => module.state)
      .map((module) => ({
        id: `m-${module.id}`,
        label: this.titleCase.transform(module.name),
        children: (module.options ?? [])
          .filter((option) => option.state)
          .map((option) => ({
            id: option.id,
            label: this.titleCase.transform(option.title || option.name),
            description: option.description || 'Sin descripción',
          })),
      }))
      .filter((node) => node.children.length),
  );

  /** Selected ids that are actually visible in the tree (hidden inactive ones are kept but not counted). */
  selectedVisibleCount(): number {
    const selected = new Set<number>(this.optionIds?.value ?? []);
    return this.optionTree().reduce((sum, m) => sum + m.children!.filter((o) => selected.has(o.id as number)).length, 0);
  }

  totalOptionCount = computed(() => this.optionTree().reduce((sum, m) => sum + m.children!.length, 0));

  protected override closeModelForm(): void {
    this.expandedOptionIds.set(new Set());
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

  protected override initializeModelForm(): void {
    this.modelForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      option_ids: this.fb.control<number[]>([], [minArrayLength(1)]),
      home_view_id: this.fb.control<number | null>(null),
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
      this.homeViewId?.setValue(event.obj.home_view ?? null);
    }
  }

  get name() {
    return this.modelForm?.get('name');
  }

  get optionIds() {
    return this.modelForm?.get('option_ids');
  }

  get homeViewId() {
    return this.modelForm?.get('home_view_id');
  }

  onOptionsChange(ids: UiTreeId[]): void {
    this.optionIds?.setValue(ids as number[]);
    this.optionIds?.markAsDirty();
    this.optionIds?.markAsTouched();
  }
}
