import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-ui-form-action-btn',
  imports: [],
  templateUrl: './ui-form-action-btn.html',
  styleUrl: './ui-form-action-btn.css',
})
export class UiFormActionBtn {
  @Input() disabled: boolean = false;
  @Output() btnClick = new EventEmitter<void>();
  @Input() type: string = 'submit';

  onClick() {
    this.btnClick.emit();
  }
}
