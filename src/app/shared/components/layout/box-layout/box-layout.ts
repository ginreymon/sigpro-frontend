import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NgClass, TitleCasePipe } from '@angular/common';
import { UiModalBadge } from '../../../elements/ui-modal-badge/ui-modal-badge';
import { ModalPurpose } from '../../../../common/const/modal-purpose';

@Component({
  selector: 'app-box-layout',
  imports: [TitleCasePipe, NgClass, UiModalBadge],
  templateUrl: './box-layout.html',
  styleUrl: './box-layout.css',
})
export class BoxLayout {
  @Input() message: string | null = null;
  @Input() title: string | null = null;
  // Purpose badge (REGISTRAR, CONFIRMAR...); omitted = no badge.
  @Input() purpose: ModalPurpose | null = null;
  @Input() transparent = false;
  @Input() zClass = 'z-50';
  @Input() classNames: string | null = null;
  @Output() onRestoreClick = new EventEmitter<void>();
}
