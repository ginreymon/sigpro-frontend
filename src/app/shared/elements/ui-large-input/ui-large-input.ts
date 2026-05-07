import { Component, forwardRef, Input } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { BaseControlValueAccessor } from '../../../common/classes/base-control-value-accessor';

@Component({
  selector: 'app-ui-large-input',
  imports: [],
  templateUrl: './ui-large-input.html',
  styleUrl: './ui-large-input.css',
   providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => UiLargeInput),
      multi: true,
    },
  ],
})
export class UiLargeInput extends BaseControlValueAccessor<string> {
  @Input() type: string = 'text';

  handleInput(event: Event) {
    const input = event.target as HTMLInputElement;
    this.value = input.value;
    this.onChange(this.value);
  }
}
