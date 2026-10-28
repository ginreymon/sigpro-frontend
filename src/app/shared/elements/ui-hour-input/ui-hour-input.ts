import { Component, forwardRef, Input } from '@angular/core';
import { BaseControlValueAccessor } from '../../../common/classes/base-control-value-accessor';
import { NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-ui-hour-input',
  imports: [],
  templateUrl: './ui-hour-input.html',
  styleUrl: './ui-hour-input.css',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => UiHourInput),
      multi: true,
    },
  ],
})
export class UiHourInput extends BaseControlValueAccessor<number | null> {
  @Input() max = 23;
  @Input() min = 0;
  @Input() title = '';
  // Shorter variant (smaller digits and padding) for dense forms.
  @Input() compact = false;

  get displayValue(): string {
    if (this.value === null || this.value === undefined || this.value === ('' as any)) return '';
    return String(Number(this.value)).padStart(2, '0');
  }

  handleInput(event: Event) {
    const raw = (event.target as HTMLInputElement).value.replace(/\D/g, '');
    const num = parseInt(raw, 10);
    if (isNaN(num)) {
      this.value = null;
      this.onChange(null);
      return;
    }
    const clamped = Math.min(Math.max(num, this.min), this.max);
    this.value = clamped;
    this.onChange(clamped);
  }
}
