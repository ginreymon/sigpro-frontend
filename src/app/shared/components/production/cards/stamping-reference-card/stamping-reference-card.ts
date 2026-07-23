import { Component, EventEmitter, Input, Output } from '@angular/core';
import { UiOptionCard } from '../../../../elements/ui-option-card/ui-option-card';
import { UiIcon } from '../../../../elements/ui-icon/ui-icon';
import { StampingReferenceSam } from '../../../../../models/stamping/stamping-reference-sam';

@Component({
  selector: 'app-stamping-reference-card',
  imports: [UiOptionCard, UiIcon],
  templateUrl: './stamping-reference-card.html',
})
export class StampingReferenceCard {
  @Input() item!: StampingReferenceSam;
  @Input() selected = false;
  @Output() onToggle = new EventEmitter<void>();
}
