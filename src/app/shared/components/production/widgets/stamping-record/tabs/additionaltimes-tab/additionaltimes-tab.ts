import { Component, EventEmitter, Input, Output } from '@angular/core';
import { UiIcon } from '../../../../../../elements/ui-icon/ui-icon';
import { Searcher } from '../../../../../form-controls/searcher/searcher';
import { UiLabelButton } from '../../../../../../elements/ui-label-button/ui-label-button';
import { UiFormField } from '../../../../../../elements/ui-form-field/ui-form-field';
import { UiErrorMessage } from '../../../../../../elements/ui-error-message/ui-error-message';
import { AdditionalStampingTimeCard } from '../../../../cards/additional-stamping-time-card/additional-stamping-time-card';
import { AdditionalStampingTime } from '../../../../../../../models/stamping/additional-stamping-time';

@Component({
  selector: 'app-additionaltimes-tab',
  standalone: true,
  imports: [UiIcon, Searcher, UiLabelButton, UiFormField, UiErrorMessage, AdditionalStampingTimeCard],
  templateUrl: './additionaltimes-tab.html',
})
export class AdditionalTimesTab {
  @Input() isLoading = false;
  @Input() showOnlySelected = false;
  @Input() selectedCount = 0;
  @Input() availableCount = 0;
  @Input() items: AdditionalStampingTime[] = [];
  @Input() selectedIds: number[] = [];
  @Input() quantities: Record<number, number | undefined> = {};
  @Input() submitAttempted = false;
  @Input() hasInvalidQuantity = false;
  // Efficiency-cap block message of the save attempt (shown above the searcher).
  @Input() efficiencyError: string | null = null;
  @Output() search = new EventEmitter<string>();
  @Output() toggleShowOnlySelected = new EventEmitter<void>();
  @Output() toggle = new EventEmitter<number>();
  @Output() quantityChange = new EventEmitter<{ id: number; value: number }>();
}
