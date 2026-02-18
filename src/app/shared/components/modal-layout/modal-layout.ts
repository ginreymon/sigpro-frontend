import { Component, EventEmitter, Input, Output } from '@angular/core';
import { UiButton } from '../../elements/ui-button/ui-button';
import { UiCloseButton } from '../../elements/ui-close-button/ui-close-button';
import { ModalBase } from '../../../common/classes/modal-base';

@Component({
  selector: 'app-modal-layout',
  imports: [UiButton, UiCloseButton],
  templateUrl: './modal-layout.html',
  styleUrl: './modal-layout.css',
})
export class ModalLayout extends ModalBase{

}
