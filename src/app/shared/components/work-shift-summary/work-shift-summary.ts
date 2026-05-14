import { Component, Input } from '@angular/core';
import { WorkShiftCard } from '../../../common/interfaces/work-shift-card';
import { UiIcon } from '../../elements/ui-icon/ui-icon';
import { UpperCasePipe } from '@angular/common';
import { ButtonBase } from '../../../common/classes/button-base';
import { UiTableButton } from "../../elements/ui-table-button/ui-table-button";

@Component({
  selector: 'app-work-shift-summary',
  imports: [UiIcon, UpperCasePipe, UiTableButton],
  templateUrl: './work-shift-summary.html',
  styleUrl: './work-shift-summary.css',
})
export class WorkShiftSummary {
  @Input() cards: WorkShiftCard[] = [];

  getDataClasses(card: WorkShiftCard): string {
    if (card.thresholds && typeof card.data === 'number') {
      if (card.data >= card.thresholds.green) return 'text-sm font-semibold text-green-600';
      if (card.data <= card.thresholds.red) return 'text-sm font-semibold text-red-600';
      return 'text-sm font-semibold text-amber-500';
    }
    return 'text-sm font-semibold text-gray-700';
  }
}
