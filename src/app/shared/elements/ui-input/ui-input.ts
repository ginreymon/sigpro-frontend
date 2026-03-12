import { Component, forwardRef, Input } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { BaseControlValueAccessor } from '../../../common/classes/base-control-value-accessor';

@Component({
  selector: 'app-ui-input',
  imports: [],
  templateUrl: './ui-input.html',
  styleUrl: './ui-input.css',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => UiInput),
      multi: true,
    },
  ],
})
export class UiInput extends BaseControlValueAccessor<string> {
  @Input() type: string = 'text';

  handleInput(event: Event) {
    const input = event.target as HTMLInputElement;
    this.value = input.value;
    this.onChange(this.value);
  }
}
