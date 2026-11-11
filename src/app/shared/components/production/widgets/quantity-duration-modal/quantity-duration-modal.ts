import { Component } from '@angular/core';
import { BoxLayout } from '../../../layout/box-layout/box-layout';
import { UiButton } from '../../../../elements/ui-button/ui-button';
import { UiFormField } from '../../../../elements/ui-form-field/ui-form-field';
import { UiLargeInput } from '../../../../elements/ui-large-input/ui-large-input';
import { ReactiveFormsModule } from '@angular/forms';
import { SkuDetail } from '../../cards/sku-detail/sku-detail';
import { SkuQuantitySummary } from '../../cards/sku-quantity-summary/sku-quantity-summary';
import { UiErrorMessage } from '../../../../elements/ui-error-message/ui-error-message';
import { QuantityDetail } from '../../cards/quantity-detail/quantity-detail';
import { SkuQuantityCounter } from '../../cards/sku-quantity-counter/sku-quantity-counter';
import { QuantityModal } from '../../modals/quantity-modal/quantity-modal';

// app-quantity-modal variant for shift-cycles-manual (modules with
// allows_production_time_adjustment=true): same template and validations,
// inherited from QuantityModal. It only relabels the button to "Agregar":
// the record is queued in the manual store and persisted later as a batch.
@Component({
  selector: 'app-quantity-duration-modal',
  standalone: true,
  imports: [BoxLayout, UiButton, UiFormField, UiLargeInput, ReactiveFormsModule, SkuDetail, SkuQuantitySummary, UiErrorMessage, QuantityDetail, SkuQuantityCounter],
  templateUrl: '../../modals/quantity-modal/quantity-modal.html',
})
export class QuantityDurationModal extends QuantityModal {
  protected override get saveButtonLabel(): string {
    return 'Agregar';
  }
}
