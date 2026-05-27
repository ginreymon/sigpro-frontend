import { Component, EventEmitter, HostBinding, Input, Output } from '@angular/core';
import { TitleCasePipe } from '@angular/common';
import { UiOptionCard } from '../../elements/ui-option-card/ui-option-card';
import { UiIcon } from '../../elements/ui-icon/ui-icon';
import { EllipsisPipe } from '../../../pipes/ellipsis-pipe';
import { WorkShift } from '../../../models/production/work-shift';

@Component({
  selector: 'app-work-shift-option-card',
  imports: [UiOptionCard, UiIcon, TitleCasePipe, EllipsisPipe],
  templateUrl: './work-shift-option-card.html',
})
export class WorkShiftOptionCard {
  @HostBinding('class') readonly hostClass = 'min-w-50 max-w-50';

  @Input() shift!: WorkShift;
  @Input() selected = false;
  @Output() onToggle = new EventEmitter<void>();
}
