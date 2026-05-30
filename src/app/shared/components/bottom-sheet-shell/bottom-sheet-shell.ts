import { Component, Input, Output, EventEmitter } from '@angular/core';
import { UiButton } from '../../elements/ui-button/ui-button';
import { UiCloseButton } from '../../elements/ui-close-button/ui-close-button';

@Component({
  selector: 'app-bottom-sheet-shell',
  imports: [UiButton, UiCloseButton],
  templateUrl: './bottom-sheet-shell.html',
})
export class BottomSheetShell {
  @Input() visible: boolean = false;
  @Input() title: string = '';
  @Input() fullscreen: boolean = false;
  @Output() onClose = new EventEmitter<void>();

  close(): void {
    this.onClose.emit();
  }
}
