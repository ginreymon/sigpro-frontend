import { Component, Input } from '@angular/core';
import { MODAL_PURPOSES, ModalPurpose } from '../../../common/const/modal-purpose';

/** Chip that states what a modal does (NUEVO, EDITAR, VER DETALLES...). Config lives in MODAL_PURPOSES. */
@Component({
  selector: 'app-ui-modal-badge',
  imports: [],
  templateUrl: './ui-modal-badge.html',
  styleUrl: './ui-modal-badge.css',
})
export class UiModalBadge {
  @Input() purpose: ModalPurpose | null | undefined = null;

  protected get config() {
    return this.purpose ? MODAL_PURPOSES[this.purpose] : null;
  }
}
