import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-form-action-btn',
  imports: [],
  templateUrl: './form-action-btn.html',
  styleUrl: './form-action-btn.css',
})
export class FormActionBtn {
  @Input() disabled: boolean = false;
  @Output() btnClick = new EventEmitter<void>();
  @Input() type: string = 'submit';

  onClick() {
    this.btnClick.emit();
  }
}
