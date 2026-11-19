import { Component } from '@angular/core';
import { WorkSpaceLayout } from '../../../layouts/work-space-layout/work-space-layout';
import { DataTable } from '../../../shared/components/table/data-table/data-table';
import { UiErrorMessage } from '../../../shared/elements/ui-error-message/ui-error-message';
import { Metadata } from '../../../shared/components/widgets/metadata/metadata';
import { BaseCrudPage } from '../../../common/classes/base-crud-page';
import { WorkBreak } from '../../../models/production/work-break';
import { ModalLayout } from '../../../shared/components/layout/modal-layout/modal-layout';
import { SideModalLayout } from '../../../shared/components/layout/side-modal-layout/side-modal-layout';
import { ReactiveFormsModule, Validators } from '@angular/forms';
import { WorkBreakService } from '../../../services/production/work-break-service';
import { UiFormField } from '../../../shared/elements/ui-form-field/ui-form-field';
import { UiFormSection } from '../../../shared/elements/ui-form-section/ui-form-section';
import { UiInput } from '../../../shared/elements/ui-input/ui-input';
import { UiBadge } from '../../../shared/elements/ui-badge/ui-badge';
import { TableTemplate } from '../../../directives/table-template';
import { CharSquare } from '../../../shared/components/widgets/char-square/char-square';
import { TableActionEvent } from '../../../common/interfaces/table-action-event';
import { TableColumn } from '../../../common/interfaces/table-column';
import { TitleCasePipe } from '@angular/common';

@Component({
  selector: 'app-work-breaks',
  imports: [
    WorkSpaceLayout,
    DataTable,
    UiErrorMessage,
    Metadata,    
    ModalLayout,   
    SideModalLayout,
    ReactiveFormsModule,
    UiFormField,
    UiFormSection,
    UiInput,
    UiBadge,
    TableTemplate,
    CharSquare,
    TitleCasePipe
  ],
  templateUrl: './work-breaks.html',
  styleUrl: './work-breaks.css',
})
export class WorkBreaks extends BaseCrudPage<WorkBreak> {
  protected override entityName: string = 'Pausa';
  constructor(private workBreakService: WorkBreakService) {
    super(workBreakService);      
  }

  protected override get columns(): TableColumn<WorkBreak>[] {
    return [
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
    const workbreak: Partial<WorkBreak> = {
      ...this.modelForm.value,
      duration: this.minutesToDuration(this.duration?.value ?? 0),
    };
    super.submit(workbreak);
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
