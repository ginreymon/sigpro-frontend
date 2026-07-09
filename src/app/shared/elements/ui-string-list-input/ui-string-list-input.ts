import { Component, forwardRef, Input } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { BaseControlValueAccessor } from '../../../common/classes/base-control-value-accessor';
import { UiIcon } from '../ui-icon/ui-icon';

@Component({
  selector: 'app-ui-string-list-input',
  imports: [UiIcon],
  templateUrl: './ui-string-list-input.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => UiStringListInput),
      multi: true,
    },
  ],
})
export class UiStringListInput extends BaseControlValueAccessor<string[]> {
  @Input() itemPlaceholder: string = '';
  @Input() addLabel: string = 'Agregar';
  @Input() numbered: boolean = true;
  @Input() allowReorder: boolean = true;
  @Input() minRows: number = 1;

  override writeValue(value: string[]): void {
    this.value = value && value.length > 0 ? [...value] : Array(this.minRows).fill('');
  }

  updateRow(index: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    const next = [...this.value];
    next[index] = input.value;
    this.value = next;
    this.onChange(this.value);
  }

  addRow(): void {
    if (this.disabled) return;
    this.value = [...this.value, ''];
    this.emitChange();
  }

  removeRow(index: number): void {
    if (this.disabled || this.value.length <= this.minRows) return;
    this.value = this.value.filter((_, i) => i !== index);
    this.emitChange();
  }

  moveUp(index: number): void {
    if (this.disabled || index <= 0) return;
    this.swap(index, index - 1);
  }

  moveDown(index: number): void {
    if (this.disabled || index >= this.value.length - 1) return;
    this.swap(index, index + 1);
  }

  private swap(i: number, j: number): void {
    const next = [...this.value];
    [next[i], next[j]] = [next[j], next[i]];
    this.value = next;
    this.emitChange();
  }

  private emitChange(): void {
    this.onChange(this.value);
    this.onTouched();
  }
}
