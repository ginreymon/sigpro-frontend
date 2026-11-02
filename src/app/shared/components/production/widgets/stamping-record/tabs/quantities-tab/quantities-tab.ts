import { Component, Input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { UiIcon } from '../../../../../../elements/ui-icon/ui-icon';
import { UiFormField } from '../../../../../../elements/ui-form-field/ui-form-field';
import { UiLargeInput } from '../../../../../../elements/ui-large-input/ui-large-input';
import { UiDecimalInput } from '../../../../../../elements/ui-decimal-input/ui-decimal-input';
import { UiErrorMessage } from '../../../../../../elements/ui-error-message/ui-error-message';
import { StampingQuantityCounter } from '../../../../cards/stamping-quantity-counter/stamping-quantity-counter';
import { UiSuccessMessage } from '../../../../../../elements/ui-success-message/ui-success-message';

@Component({
  selector: 'app-quantities-tab',
  standalone: true,
  imports: [ReactiveFormsModule, UiIcon, UiFormField, UiLargeInput, UiDecimalInput, UiErrorMessage, StampingQuantityCounter, UiSuccessMessage],
  templateUrl: './quantities-tab.html',
})
export class QuantitiesTab {
  @Input() isLoading = false;
  @Input() isOrderCompleted = false;
  @Input() hasSelectedReference = false;
  @Input() completedQuantityControl!: FormControl;
  @Input() usesProcessesSearch = false;
  @Input() totalPendingQuantity = 0;
  @Input() totalStampedQuantity = 0;
  @Input() newCompletedQty = 0;
  @Input() efficiencyForecast: number | null = null;
  @Input() exceedsMaxError: { max: number; total: number } | null = null;
  @Input() orderLabel = '';
}
