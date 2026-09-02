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

// Variante de app-quantity-modal para el asistente de shift-cycles-manual
// (módulos con allows_production_time_adjustment=true): mismo template, mismas
// validaciones — hereda todo tal cual de QuantityModal. La única diferencia
// es Guardar: por el momento el guardado real de este flujo no está
// definido, así que solo se muestra una alerta de confirmación en vez de
// omitirla silenciosamente; sigue emitiendo onSave con el payload normal
// para que el llamador (ShiftCyclesManual.saveSKU) mantenga el control de
// qué hacer con él, igual que en el flujo normal.
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

  override save(): void {
    if (this.recordForm.invalid || this.isSubmitting() || !this.enable) return;   
    super.save();
  }
}
