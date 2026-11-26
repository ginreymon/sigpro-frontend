import { Component, Input, Signal, signal, AfterViewInit } from '@angular/core';
import { ModalBase } from '../../../../common/classes/modal-base';
import { UiButton } from '../../../elements/ui-button/ui-button';
import { UiModalBadge } from '../../../elements/ui-modal-badge/ui-modal-badge';
import { ModalPurpose } from '../../../../common/const/modal-purpose';
import { UiCloseButton } from '../../../elements/ui-close-button/ui-close-button';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-side-modal-layout',
  imports: [UiButton, UiCloseButton, UiModalBadge],
  templateUrl: './side-modal-layout.html',
  styleUrl: './side-modal-layout.css',
})
export class SideModalLayout extends ModalBase implements AfterViewInit {
  private static nextId = 0;
  protected override serviceVisible?: Signal<boolean> = toSignal(this.dialogService.sideModalVisible$, { initialValue: false });
  readonly initialized = signal(false);
  // Names the dialog after its title for screen readers.
  protected readonly titleId = `side-modal-title-${SideModalLayout.nextId++}`;
  // Footer and close buttons keep their look on mouse over.
  @Input() noHover = false;
  // Side modals are detail views by default.
  @Input() purpose: ModalPurpose | null = 'view';

  ngAfterViewInit(): void {
    setTimeout(() => this.initialized.set(true));
  }
}
