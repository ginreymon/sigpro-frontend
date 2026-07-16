import { Component, Input, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UiFormField } from '../../../../elements/ui-form-field/ui-form-field';
import { UiInput } from '../../../../elements/ui-input/ui-input';
import { calcSamTarget } from '../sam-target-calculator/sam-target-formula';

@Component({
  selector: 'app-sam-goal-calculator',
  imports: [FormsModule, UiFormField, UiInput],
  templateUrl: './sam-goal-calculator.html',
})
export class SamGoalCalculator {
  @Input() samValue: number | string | null = null;
  @Input() reference: string | null = null;
  @Input() description: string | null = null;

  intervalo = signal<number>(60);
  operarios = signal<number>(1);

  targetUnits = computed(() => calcSamTarget(this.samValue, this.intervalo(), this.operarios()));
}
