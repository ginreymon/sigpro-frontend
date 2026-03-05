import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-ui-option-card',
  imports: [],
  templateUrl: './ui-option-card.html',
  styleUrl: './ui-option-card.css',
})
export class UiOptionCard {
  @Input() obj: any = null;
  @Input() selected = false;
  @Input() disabled = false;
  @Output() onToggle = new EventEmitter<any>();

  toggleHandler() {
    if (this.disabled) return;

    this.selected = !this.selected;
    this.onToggle.emit(this.obj);
  }
}
