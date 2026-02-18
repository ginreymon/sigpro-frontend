import { Component, Input } from '@angular/core';
import { ModalBase } from '../../../common/classes/modal-base';
import { UiButton } from '../../elements/ui-button/ui-button';
import { UiCloseButton } from '../../elements/ui-close-button/ui-close-button';

@Component({
  selector: 'app-side-modal-layout',
  imports: [UiButton, UiCloseButton],
  templateUrl: './side-modal-layout.html',
  styleUrl: './side-modal-layout.css',
})
export class SideModalLayout extends ModalBase {}
