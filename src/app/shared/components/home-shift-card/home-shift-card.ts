import { Component } from '@angular/core';
import { WorkShiftSummary } from '../work-shift-summary/work-shift-summary';
import { UiIcon } from '../../elements/ui-icon/ui-icon';
import { UpperCasePipe } from '@angular/common';

@Component({
  selector: 'app-home-shift-card',
  imports: [UiIcon, UpperCasePipe],
  templateUrl: './home-shift-card.html',
})
export class HomeShiftCard extends WorkShiftSummary {}
