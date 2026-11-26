import { UiModalBadge } from '../../../elements/ui-modal-badge/ui-modal-badge';
import { ModalPurpose } from '../../../../common/const/modal-purpose';
import { Component, Input, Signal } from '@angular/core';
import { UiButton } from '../../../elements/ui-button/ui-button';
import { UiCloseButton } from '../../../elements/ui-close-button/ui-close-button';
import { ModalBase } from '../../../../common/classes/modal-base';
import { toSignal } from '@angular/core/rxjs-interop';
import { TitleCasePipe } from '@angular/common';

@Component({
  selector: 'app-modal-layout',
  imports: [UiButton, UiCloseButton, UiModalBadge, TitleCasePipe],
  templateUrl: './modal-layout.html',
  styleUrl: './modal-layout.css',
})
export class ModalLayout extends ModalBase{
  @Input() classNames: string | null = null;  
  // El título pasa por titlecase; esto lo muestra en mayúsculas (solo estilo).
  @Input() uppercaseTitle: boolean = false;
  // Optional header context: short description and create/edit chip. Omitted = header unchanged.
  @Input() subtitle: string | null = null;
  // Purpose badge (NUEVO, EDITAR, VER DETALLES...); omitted = no badge.
  @Input() mode: ModalPurpose | null | undefined = null;
  // Disables the accept button (the parent shows why, e.g. with an alert in `modal-top`).
  @Input() acceptDisabled: boolean = false;
  protected override serviceVisible?: Signal<boolean> = toSignal(this.dialogService.modalVisible$, { initialValue: false });
}
