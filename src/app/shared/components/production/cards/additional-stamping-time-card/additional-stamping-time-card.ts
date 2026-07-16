import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TitleCasePipe } from '@angular/common';
import { UiOptionCard } from '../../../../elements/ui-option-card/ui-option-card';
import { UiIcon } from '../../../../elements/ui-icon/ui-icon';
import { AdditionalStampingTime } from '../../../../../models/stamping/additional-stamping-time';

@Component({
  selector: 'app-additional-stamping-time-card',
  imports: [UiOptionCard, UiIcon, TitleCasePipe],
  templateUrl: './additional-stamping-time-card.html',
})
export class AdditionalStampingTimeCard {
  @Input() item: AdditionalStampingTime | null = null;
  @Input() selected = false;
  @Output() onToggle = new EventEmitter<void>();
}
