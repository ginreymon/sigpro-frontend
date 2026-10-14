import { Component, Input, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UiFormField } from '../../../../elements/ui-form-field/ui-form-field';
import { UiInput } from '../../../../elements/ui-input/ui-input';
import {
  calcSamIntervalo,
  calcSamOperarios,
  calcSamTarget,
} from '../sam-target-calculator/sam-target-formula';

type SamGoalField = 'meta' | 'intervalo' | 'operarios';

const FIELD_LABEL: Record<SamGoalField, string> = {
  meta: 'Meta',
  intervalo: 'Intervalo',
  operarios: 'Operarios',
};
const FIELD_UNIT: Record<SamGoalField, string> = {
  meta: 'Unidades',
  intervalo: 'min',
  operarios: 'Operarios',
};

@Component({
  selector: 'app-sam-goal-calculator',
  imports: [FormsModule, UiFormField, UiInput],
  templateUrl: './sam-goal-calculator.html',
})
export class SamGoalCalculator {
  @Input() samValue: number | string | null = null;
  @Input() reference: string | null = null;
  @Input() description: string | null = null;

  protected readonly fields: SamGoalField[] = ['meta', 'intervalo', 'operarios'];
  protected readonly label = FIELD_LABEL;
  protected readonly unit = FIELD_UNIT;

  // The field being calculated; the other two are inputs.
  mode = signal<SamGoalField>('meta');

  meta = signal<number>(0);
  intervalo = signal<number>(60);
  operarios = signal<number>(1);

  result = computed(() => {
    switch (this.mode()) {
      case 'meta':
        return calcSamTarget(this.samValue, this.intervalo(), this.operarios());
      case 'intervalo':
        return calcSamIntervalo(this.samValue, this.meta(), this.operarios());
      case 'operarios':
        return calcSamOperarios(this.samValue, this.meta(), this.intervalo());
    }
  });

  // Switching keeps the number on screen: the value that was the result becomes
  // the input of the field that is no longer calculated.
  setMode(next: SamGoalField): void {
    const previous = this.mode();
    if (next === previous) return;
    const shown = Number(this.result());
    if (Number.isFinite(shown) && shown > 0) this.signalOf(previous).set(shown);
    this.mode.set(next);
  }

  private signalOf(field: SamGoalField) {
    return { meta: this.meta, intervalo: this.intervalo, operarios: this.operarios }[field];
  }
}
