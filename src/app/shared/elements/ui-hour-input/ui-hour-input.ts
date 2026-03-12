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
export class UiHourInput extends BaseControlValueAccessor<number|string> {
  @Input() max = 23;
  @Input() min = 0;
  @Input() title = '';

  handleInput(event: Event) {
    const input = event.target as HTMLInputElement;
    this.value = input.value;
    this.onChange(this.value);
  }
}
