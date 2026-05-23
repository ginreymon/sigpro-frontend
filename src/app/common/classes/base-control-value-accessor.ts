import { Directive, Input } from '@angular/core';
import { AbstractControl, ControlValueAccessor } from '@angular/forms';

@Directive()
export abstract class BaseControlValueAccessor<T> implements ControlValueAccessor {
  @Input() className: string = '';
  @Input() placeholder: string = '';
  @Input() id: string = '';
  @Input() control: AbstractControl | null = null;
  @Input() extraInvalid: boolean = false;

  value!: T;
  disabled = false;

  get invalid(): boolean {
    return (!!this.control && this.control.invalid && this.control.touched) || this.extraInvalid;
  }

  onChange: (value: T) => void = () => {};
  onTouched: () => void = () => {};

  writeValue(value: T): void {
    this.value = value;
  }

  registerOnChange(fn: (value: T) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}
