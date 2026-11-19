import { Component, forwardRef, Input } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { BaseControlValueAccessor } from '../../../common/classes/base-control-value-accessor';

@Component({
  selector: 'app-ui-decimal-input',
  imports: [],
  templateUrl: './ui-decimal-input.html',
  styleUrl: './ui-decimal-input.css',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => UiDecimalInput),
      multi: true,
    },
  ],
})
export class UiDecimalInput extends BaseControlValueAccessor<number | null> {
  @Input() hasAddon: boolean = false;
  @Input() decimals: number = 2;

  displayValue: string = '';

  override writeValue(value: number | null): void {
    this.value = value;
    this.displayValue = value === null || value === undefined ? '' : String(value).replace('.', ',');
  }

  handleInput(event: Event) {
    const input = event.target as HTMLInputElement;
    let raw = input.value.replace(/[^0-9.,]/g, '');

    // decimals = 0 means integers only: no separator at all.
    if (this.decimals === 0) raw = raw.replace(/[.,]/g, '');

    const firstSeparator = raw.search(/[.,]/);
    if (firstSeparator !== -1) {
      const integerPart = raw.slice(0, firstSeparator).replace(/[.,]/g, '');
      const decimalPart = raw
        .slice(firstSeparator + 1)
        .replace(/[.,]/g, '')
        .slice(0, this.decimals);
      raw = `${integerPart},${decimalPart}`;
    }

    this.displayValue = raw;
    input.value = raw;

    const normalized = raw.replace(',', '.');
    if (normalized === '' || normalized === '.') {
      this.value = null;
      this.onChange(null);
      return;
    }

    const num = Number(normalized);
    if (isNaN(num)) return;

    this.value = num;
    this.onChange(num);
  }
}
