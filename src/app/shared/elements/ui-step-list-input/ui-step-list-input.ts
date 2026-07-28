import { Component, forwardRef, Input } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { BaseControlValueAccessor } from '../../../common/classes/base-control-value-accessor';
import { UiIcon } from '../ui-icon/ui-icon';
import { AdditionalStampingTimeStep } from '../../../models/stamping/additional-stamping-time';

@Component({
  selector: 'app-ui-step-list-input',
  imports: [UiIcon],
  templateUrl: './ui-step-list-input.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => UiStepListInput),
      multi: true,
    },
  ],
})
export class UiStepListInput extends BaseControlValueAccessor<AdditionalStampingTimeStep[]> {
  @Input() descriptionPlaceholder: string = 'Describe el paso';
  @Input() timePlaceholder: string = 'Tiempo';
  @Input() addLabel: string = 'Agregar paso';
  @Input() minRows: number = 0;

  private emptyRow(): AdditionalStampingTimeStep {
    return { description: '', standard_time: null };
  }

  override writeValue(value: AdditionalStampingTimeStep[]): void {
    this.value =
      value && value.length > 0
        ? value.map((step) => ({ ...step }))
        : Array.from({ length: this.minRows }, () => this.emptyRow());
  }

  updateDescription(index: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    const next = [...this.value];
    next[index] = { ...next[index], description: input.value };
    this.value = next;
    this.onChange(this.value);
  }

  updateStandardTime(index: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    const next = [...this.value];
    next[index] = { ...next[index], standard_time: input.value === '' ? null : input.value };
    this.value = next;
    this.onChange(this.value);
  }

  addRow(): void {
    if (this.disabled) return;
    this.value = [...this.value, this.emptyRow()];
    this.emitChange();
  }

  removeRow(index: number): void {
    if (this.disabled || this.value.length <= this.minRows) return;
    this.value = this.value.filter((_, i) => i !== index);
    this.emitChange();
  }

  private emitChange(): void {
    this.onChange(this.value);
    this.onTouched();
  }
}
