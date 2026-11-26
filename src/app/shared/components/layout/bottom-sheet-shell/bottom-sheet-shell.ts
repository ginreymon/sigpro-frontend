import { Component, Input, Output, EventEmitter } from '@angular/core';
import { UiButton } from '../../../elements/ui-button/ui-button';
import { UiCloseButton } from '../../../elements/ui-close-button/ui-close-button';
import { UiModalBadge } from '../../../elements/ui-modal-badge/ui-modal-badge';
import { ModalPurpose } from '../../../../common/const/modal-purpose';

@Component({
  selector: 'app-bottom-sheet-shell',
  imports: [UiButton, UiCloseButton, UiModalBadge],
  templateUrl: './bottom-sheet-shell.html',
})
export class BottomSheetShell {
  @Input() visible: boolean = false;
  @Input() title: string = '';
  // Bottom sheets are detail views by default.
  @Input() purpose: ModalPurpose | null = 'view';
  @Input() fullscreen: boolean = false;
  @Output() onClose = new EventEmitter<void>();

  close(): void {
    this.onClose.emit();
  }
}
