import { Component, Input } from '@angular/core';
import { BoxLayout } from '../box-layout/box-layout';
import { UiButton } from '../../elements/ui-button/ui-button';
import { ModalBase } from '../../../common/classes/modal-base';

@Component({
  selector: 'app-confirm-box',
  imports: [BoxLayout, UiButton],
  templateUrl: './confirm-box.html',
  styleUrl: './confirm-box.css',
})
export class ConfirmBox extends ModalBase {
  @Input() hideCancelBtn: boolean = false;
}
