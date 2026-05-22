import { Component, Input, Output, EventEmitter } from '@angular/core';
import { UiButton } from '../../elements/ui-button/ui-button';
import { UiCloseButton } from '../../elements/ui-close-button/ui-close-button';

@Component({
  selector: 'app-balance-bottom-sheet',
  imports: [UiButton, UiCloseButton],
  templateUrl: './balance-bottom-sheet.html',
  styleUrl: './balance-bottom-sheet.css',
})
export class BalanceBottomSheet {
  @Input() visible: boolean = false;
  @Output() onClose = new EventEmitter<void>();

  close() {
    this.onClose.emit();
  }
}
