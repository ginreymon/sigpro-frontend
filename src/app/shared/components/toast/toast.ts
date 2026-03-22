import { Component, Signal } from '@angular/core';
import { ModalBase } from '../../../common/classes/modal-base';
import { UiCloseButton } from '../../elements/ui-close-button/ui-close-button';
import { UiIcon } from '../../elements/ui-icon/ui-icon';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-toast',
  imports: [UiCloseButton, UiIcon],
  templateUrl: './toast.html',
  styleUrl: './toast.css',
})
export class Toast extends ModalBase {
  protected override serviceVisible?: Signal<boolean> = toSignal(this.dialogService.toastVisible$, { initialValue: false });

  override close(): void {
    this.dialogService.closeToast();
  }
}
