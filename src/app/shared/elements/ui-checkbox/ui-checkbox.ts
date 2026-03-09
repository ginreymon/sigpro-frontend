import { Component, forwardRef, Input } from '@angular/core';
import { AbstractControl, ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

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
export class UiCheckbox implements ControlValueAccessor {

  @Input() id: string = '';
  @Input() className: string = '';
  @Input() control: AbstractControl | null = null;

  value = false;
  disabled = false;

  get invalid(): boolean {
    return !!this.control && this.control.invalid && this.control.touched;
  }

  onChange = (value: boolean) => {};
  onTouched = () => {};

  writeValue(obj: boolean): void {
    this.value = obj ?? false;
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  handleChange(event: Event) {
    const input = event.target as HTMLInputElement;
    this.value = input.checked;
    this.onChange(this.value);
  }
}