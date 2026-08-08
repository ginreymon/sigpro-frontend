import { Component, EventEmitter, Input, Output } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { UiOptionCard } from '../../../../elements/ui-option-card/ui-option-card';
import { UiIcon } from '../../../../elements/ui-icon/ui-icon';
import { StampingReferenceSam } from '../../../../../models/stamping/stamping-reference-sam';

@Component({
  selector: 'app-stamping-reference-card',
  imports: [UiOptionCard, UiIcon, DecimalPipe],
  templateUrl: './stamping-reference-card.html',
})
export class StampingReferenceCard {
  @Input() item!: StampingReferenceSam;
  @Input() selected = false;
  @Output() onToggle = new EventEmitter<void>();

  // En progreso: ya tiene algo estampado pero todavía queda pendiente para este SAM.
  protected get isInProgress(): boolean {
    return (this.item.stamped_qty ?? 0) > 0 && (this.item.pending_qty ?? 0) > 0;
  }
}
