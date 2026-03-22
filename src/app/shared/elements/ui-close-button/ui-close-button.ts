import { Component, EventEmitter, Input, Output } from '@angular/core';
import { UiIcon } from '../ui-icon/ui-icon';

@Component({
  selector: 'app-ui-close-button',
  imports: [UiIcon],
  templateUrl: './ui-close-button.html',
  styleUrl: './ui-close-button.css',
})
export class UiCloseButton {
  @Output() onClose = new EventEmitter<void>();
  @Input() className:string|null = null;

  close() {
    this.onClose.emit();
  }
}
