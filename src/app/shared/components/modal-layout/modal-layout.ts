import { Component, Signal } from '@angular/core';
import { UiButton } from '../../elements/ui-button/ui-button';
import { UiCloseButton } from '../../elements/ui-close-button/ui-close-button';
import { ModalBase } from '../../../common/classes/modal-base';
import { toSignal } from '@angular/core/rxjs-interop';
import { TitleCasePipe } from '@angular/common';

@Component({
  selector: 'app-modal-layout',
  imports: [UiButton, UiCloseButton, TitleCasePipe],
  templateUrl: './modal-layout.html',
  styleUrl: './modal-layout.css',
})
export class ModalLayout extends ModalBase{
  protected override serviceVisible?: Signal<boolean> = toSignal(this.dialogService.modalVisible$, { initialValue: false });
}
