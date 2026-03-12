import { Component, forwardRef } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { BaseControlValueAccessor } from '../../../common/classes/base-control-value-accessor';

@Component({
  selector: 'app-ui-checkbox',
  templateUrl: './ui-checkbox.html',
  styleUrl: './ui-checkbox.css',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => UiCheckbox),
      multi: true,
    },
  ],
})
export class UiCheckbox extends BaseControlValueAccessor<boolean> {
  handleChange(event: Event) {
    const input = event.target as HTMLInputElement;
    this.value = input.checked;
    this.onChange(this.value);
  }
}
