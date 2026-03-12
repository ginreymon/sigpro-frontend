import { Component } from '@angular/core';
import { WorkSpaceLayout } from '../../../layouts/work-space-layout/work-space-layout';
import { DataTable } from '../../../shared/components/data-table/data-table';
import { UiErrorMessage } from '../../../shared/elements/ui-error-message/ui-error-message';
import { Metadata } from '../../../shared/components/metadata/metadata';
import { BaseCrudPage } from '../../../common/classes/base-crud-page';
import { WorkBreak } from '../../../models/production/work-break';
import { Loader } from '../../../shared/elements/loader/loader';
import { ModalLayout } from '../../../shared/components/modal-layout/modal-layout';
import { ConfirmBox } from '../../../shared/components/confirm-box/confirm-box';
import { SideModalLayout } from '../../../shared/components/side-modal-layout/side-modal-layout';
import { ReactiveFormsModule, Validators } from '@angular/forms';
import { WorkBreakService } from '../../../services/production/work-break-service';
import { UiFormField } from '../../../shared/elements/ui-form-field/ui-form-field';
import { UiInput } from '../../../shared/elements/ui-input/ui-input';
import { finalize } from 'rxjs';
import { UiBadge } from '../../../shared/elements/ui-badge/ui-badge';
import { TableTemplate } from '../../../directives/table-template';
import { CharSquare } from '../../../shared/components/char-square/char-square';
import { TableActionEvent } from '../../../common/interfaces/table-action-event';

@Component({
  selector: 'app-work-breaks',
  imports: [
    WorkSpaceLayout,
    DataTable,
    UiErrorMessage,
    Metadata,
    Loader,
    ModalLayout,
    ConfirmBox,
    SideModalLayout,
    ReactiveFormsModule,
    UiFormField,
    UiInput,
    UiBadge,
    TableTemplate,
    CharSquare,
  ],
  templateUrl: './work-breaks.html',
  styleUrl: './work-breaks.css',
})
export class WorkBreaks extends BaseCrudPage<WorkBreak> {
  constructor(private workBreakService: WorkBreakService) {
    super(workBreakService);
    this.actions.edit = { enabled: true, title: 'Editar turno' };
    this.actions.view = { enabled: true, title: 'Ver turno' };
    this.actions.delete = { enabled: true, title: 'Eliminar turno' };
    this.actions.create = { enabled: true, title: 'Crear turno' };
    this.tableToolsButtons.addItem.enabled = true;
  }

  protected override initializeColumns(): void {
    this.columns = [
      { field: 'name', label: 'Nombre' },
      { field: 'duration', label: 'Duración' },
      { type: 'template', label: 'Estado', templateName: 'statusTemplate' },
    ];
  }

  protected override initializeModelForm(): void {
    this.modelForm = this.fb.group({
      name: [null, [Validators.required, Validators.minLength(4)]],
      duration: [0, [Validators.required, Validators.min(1)]],
      description: [null],
      is_active: [true],
    });
  }

  get name() {
    return this.modelForm.get('name');
  }

  get duration() {
    return this.modelForm.get('duration');
  }

  get description() {
    return this.modelForm.get('description');
  }

  get isActive() {
    return this.modelForm.get('is_active');
  }

  protected override submit(): void {
    if (!this.validateModelForm()) return;
    this.showLoader.set(true);

    const workbreak: Partial<WorkBreak> = {
      ...this.modelForm.value,
      duration: this.minutesToDuration(this.duration?.value ?? 0),
    };

    const request$ =
      this.actionType == 'create'
        ? this.workBreakService.create(workbreak)
        : this.workBreakService.update(this.rowObject.id!, workbreak);

    request$.pipe(finalize(() => this.reload(() => this.showLoader.set(false)))).subscribe({
      next: () => this.closeModelForm(),
      error: (err) => {
        this.errorMessage.set('Ocurrió un error. Intente nuevamente.');
      },
    });
  }

  protected override actionHandler(event: TableActionEvent<WorkBreak>): void {
    super.actionHandler(event);
    if (event.type == 'edit') {
      this.modelForm.patchValue({
        ...event.obj,
        duration: this.durationToMinutes(event.obj.duration),
      });
    }
  }

  minutesToDuration(minutes: number): string {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hrs}:${mins}:00`;
  }

  durationToMinutes(duration: string): Number {
    const [h, m, s] = duration.split(':').map(Number);
    return h * 60 + m;
  }
}
