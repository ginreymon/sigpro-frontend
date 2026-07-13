import { Component, Signal, signal, AfterViewInit } from '@angular/core';
import { ModalBase } from '../../../../common/classes/modal-base';
import { UiButton } from '../../../elements/ui-button/ui-button';
import { UiCloseButton } from '../../../elements/ui-close-button/ui-close-button';
import { toSignal } from '@angular/core/rxjs-interop';
import { TitleCasePipe } from '@angular/common';

@Component({
  selector: 'app-side-modal-layout',
  imports: [UiButton, UiCloseButton, TitleCasePipe],
  templateUrl: './side-modal-layout.html',
  styleUrl: './side-modal-layout.css',
})
export class SideModalLayout extends ModalBase implements AfterViewInit {
  protected override serviceVisible?: Signal<boolean> = toSignal(this.dialogService.sideModalVisible$, { initialValue: false });
  readonly initialized = signal(false);

  ngAfterViewInit(): void {
    setTimeout(() => this.initialized.set(true));
  }
}
