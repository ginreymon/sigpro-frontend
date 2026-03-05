import { Component, inject, Input } from '@angular/core';
import { ModalBase } from '../../../common/classes/modal-base';
import { UiCloseButton } from '../../elements/ui-close-button/ui-close-button';
import { UiIcon } from '../../elements/ui-icon/ui-icon';
import { DialogService } from '../../../services/common/dialog-service';

@Component({
  selector: 'app-toast',
  imports: [UiCloseButton, UiIcon],
  templateUrl: './toast.html',
  styleUrl: './toast.css',
})
export class Toast extends ModalBase {
  private autoCloseTimer: any;
  private duration = 2500; // 2.5 seconds
 
  @Input() iconName: string = '';
  @Input() override set visible(value: boolean) {
    this.openModal.set(value);

    if (value) {
      this.startAutoClose();
    } else {
      this.clearTimer();
    }
  }

  private startAutoClose() {
    this.clearTimer();

    this.autoCloseTimer = setTimeout(() => {
      this.closeToast();
    }, this.duration);
  }

  private clearTimer() {
    if (this.autoCloseTimer) {
      clearTimeout(this.autoCloseTimer);
      this.autoCloseTimer = null;
    }
  }

  ngOnDestroy() {
    this.clearTimer();
  }
}
