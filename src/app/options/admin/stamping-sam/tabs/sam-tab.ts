import { Component, Input } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { UiFormField } from '../../../../shared/elements/ui-form-field/ui-form-field';
import { UiInput } from '../../../../shared/elements/ui-input/ui-input';
import { UiCheckbox } from '../../../../shared/elements/ui-checkbox/ui-checkbox';
import { TableActionType } from '../../../../common/interfaces/table-actions';
import { calcSamTarget } from '../../../../shared/components/production/widgets/sam-target-calculator/sam-target-formula';

@Component({
  selector: 'app-sam-tab',
  imports: [ReactiveFormsModule, UiFormField, UiInput, UiCheckbox],
  templateUrl: './sam-tab.html',
})
export class SamTab {
  @Input({ required: true }) form!: FormGroup;
  @Input() actionType: TableActionType | null | undefined = null;

  get sam() { return this.form.get('sam'); }
  get isActive() { return this.form.get('is_active'); }
  get taskPeopleCount() { return this.form.get('task_people_count'); }

  // Vista previa en el form (sin id todavía) — replica exactamente la
  // fórmula de StampingReferenceSam.tasks_per_hour: round(60 * task_people_count / sam).
  calcTasksPerHour(sam: string | number | null, taskPeopleCount: string | number | null): string | null {
    const people = Number(taskPeopleCount);
    if (!people || people <= 0) return null;
    return calcSamTarget(sam, 60, people);
  }
}
