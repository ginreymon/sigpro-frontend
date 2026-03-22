import { Component, Signal } from '@angular/core';
import { BoxLayout } from '../box-layout/box-layout';
import { UiButton } from '../../elements/ui-button/ui-button';
import { ModalBase } from '../../../common/classes/modal-base';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-confirm-box',
  imports: [BoxLayout, UiButton],
  templateUrl: './confirm-box.html',
  styleUrl: './confirm-box.css',
})
export class ConfirmBox extends ModalBase {
  protected override serviceVisible?: Signal<boolean> = toSignal(this.dialogService.confirmVisible$, { initialValue: false });
}
