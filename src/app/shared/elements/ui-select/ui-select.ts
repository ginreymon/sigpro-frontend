import { Component, EventEmitter, forwardRef, Input, Output } from '@angular/core';
import {
  AbstractControl,
  ControlValueAccessor,
  FormsModule,
  NG_VALUE_ACCESSOR,
} from '@angular/forms';

@Component({
  selector: 'app-ui-select',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './ui-select.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => UiSelect),
      multi: true,
    },
  ],
})
export class UiSelect implements ControlValueAccessor {
  protected _items: any[] = [];

  @Input() set items(arr: any[]) {
    this._items = arr;
  }

  @Input() key: string | null = null;
  @Input() keyValue:string  | null = null; 

  @Input() className: string = '';
  @Input() control: AbstractControl | null = null;
  @Input() id: string = '';
  @Input() showDefaultOption:boolean = false;

  value: string | number | null = null;
  disabled = false;

  @Output() onChange = new EventEmitter<{ index: number; value: any }>();

  get invalid(): boolean {
    return !!this.control && this.control.invalid && this.control.touched;
  }

  get items() {
    if (this.key) {
      return this._items.map((item) => {
        return item[this.key!];
      });
    }
    return this._items;
  }

  private propagateChange: any = () => {};
  onTouched = () => {};

  changeHandle(value: string | number) {
    this.value = value;
    const index = this.items.findIndex((i) => i == value);
    this.propagateChange(value);
    this.onChange.emit({ index, value: this._items[index] });
  }

  writeValue(value: any): void {
    this.value = value;
  }

  registerOnChange(fn: any): void {
    this.propagateChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}
