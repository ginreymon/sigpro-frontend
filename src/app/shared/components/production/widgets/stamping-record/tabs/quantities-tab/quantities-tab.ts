import { Component, Input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { UiIcon } from '../../../../../../elements/ui-icon/ui-icon';
import { UiFormField } from '../../../../../../elements/ui-form-field/ui-form-field';
import { UiLargeInput } from '../../../../../../elements/ui-large-input/ui-large-input';
import { UiErrorMessage } from '../../../../../../elements/ui-error-message/ui-error-message';
import { StampingQuantityCounter } from '../../../../cards/stamping-quantity-counter/stamping-quantity-counter';

@Component({
  selector: 'app-quantities-tab',
  standalone: true,
  imports: [ReactiveFormsModule, UiIcon, UiFormField, UiLargeInput, UiErrorMessage, StampingQuantityCounter],
  templateUrl: './quantities-tab.html',
})
export class QuantitiesTab {
  @Input() isLoading = false;
  @Input() isOrderCompleted = false;
  @Input() hasSelectedReference = false;
  @Input() completedQuantityControl!: FormControl;
  @Input() totalPendingQuantity = 0;
  @Input() totalStampedQuantity = 0;
  @Input() newCompletedQty = 0;
  @Input() exceedsMaxError: { max: number; total: number } | null = null;
  @Input() orderLabel = '';
}
