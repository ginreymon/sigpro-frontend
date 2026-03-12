import { Component, EventEmitter, forwardRef, Input, Output } from '@angular/core';
import { FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { BaseControlValueAccessor } from '../../../common/classes/base-control-value-accessor';

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
export class UiSelect extends BaseControlValueAccessor<any> {
  protected _items: any[] = [];

  @Input() set items(arr: any[]) {
    this._items = arr;
  }

  @Input() key: string | null = null;
  @Input() keyValue: string | null = null;
  @Input() showDefaultOption: boolean = false;

  override value: string | number | null = null;

  @Output() onSelect = new EventEmitter<{ index: number; value: any }>();

  get items() {
    if (this.key) {
      return this._items.map((item) => {
        return item[this.key!];
      });
    }
    return this._items;
  }

  changeHandle(value: string | number) {
    this.value = value;
    const index = this.items.findIndex((i) => i == value);
    this.onChange(value);
    this.onSelect.emit({ index, value: this._items[index] });
  }
}
