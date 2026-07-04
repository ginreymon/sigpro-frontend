import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-measure-cell-input',
  imports: [],
  templateUrl: './measure-cell-input.html',
})
export class MeasureCellInput {
  @Input() value: string = '';
  @Input() align: 'left' | 'center' = 'left';
  @Input() type: 'text' | 'number' = 'text';

  @Output() valueChange = new EventEmitter<string>();

  handleInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    let value = input.value;

    if (this.type === 'number') {
      value = value.replace(',', '.').replace(/[^0-9.]/g, '');
      const firstDot = value.indexOf('.');
      if (firstDot !== -1) {
        value = value.slice(0, firstDot + 1) + value.slice(firstDot + 1).replace(/\./g, '');
      }
      if (value !== input.value) {
        input.value = value;
      }
    }

    this.valueChange.emit(value);
  }
}
