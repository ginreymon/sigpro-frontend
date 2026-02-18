import { Component, EventEmitter, Output } from '@angular/core';
import { UiIcon } from '../ui-icon/ui-icon';

@Component({
  selector: 'app-ui-close-button',
  imports: [UiIcon],
  templateUrl: './ui-close-button.html',
  styleUrl: './ui-close-button.css',
})
export class UiCloseButton {
  @Output() onClose = new EventEmitter<void>();

  close() {
    this.onClose.emit();
  }
}
