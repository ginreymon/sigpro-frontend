import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-ui-select',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './ui-select.html',
})
export class UiSelect {
  @Input() items: (string | number)[] = [];
  @Input() model!: string | number;

  @Output() onChange = new EventEmitter<{
    index: number;
    value: string | number;
  }>();

  changeHandle(value: string | number) {
    const index = this.items.findIndex((i) => i == value);
    this.onChange.emit({ index, value });
  }
}
