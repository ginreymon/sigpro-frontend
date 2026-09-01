import { Component, OnChanges } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { BoxLayout } from '../../../layout/box-layout/box-layout';
import { UiButton } from '../../../../elements/ui-button/ui-button';
import { UiIcon } from '../../../../elements/ui-icon/ui-icon';
import { UiTabs } from '../../../../elements/ui-tabs/ui-tabs';
import { ShiftCyclesFab } from '../shift-cycles-fab/shift-cycles-fab';
import { Searcher } from '../../../form-controls/searcher/searcher';
import { UiLabelButton } from '../../../../elements/ui-label-button/ui-label-button';
import { UiFormField } from '../../../../elements/ui-form-field/ui-form-field';
import { UiLargeInput } from '../../../../elements/ui-large-input/ui-large-input';
import { UiErrorMessage } from '../../../../elements/ui-error-message/ui-error-message';
import { AdditionalStampingTimeCard } from '../../cards/additional-stamping-time-card/additional-stamping-time-card';
import { StampingReferenceCard } from '../../cards/stamping-reference-card/stamping-reference-card';
import { StampingQuantityCounter } from '../../cards/stamping-quantity-counter/stamping-quantity-counter';
import { StampingRecord } from '../stamping-record/stamping-record';

// Variante de app-stamping-record para shift-cycles-manual (módulos con
// allows_production_time_adjustment=true): mismo template y validaciones —
// hereda todo tal cual de StampingRecord (mismo patrón que
// app-quantity-duration-modal extiende app-quantity-modal), sin modificar
// StampingRecord. La única diferencia es que el registro no depende de
// STAMPING_CAL_WINDOW: ese flujo no tiene ventana horaria propia, a
// diferencia del registro en tiempo real de estampación — se fuerza
// inWindow=true en cada cambio de inputs (ver ngOnChanges), sin importar lo
// que el llamador (app-shift-cycles-manual) le pase. register() se hereda
// tal cual: sigue emitiendo onSave con el payload normal — es
// ShiftCyclesManual.saveStamping quien decide guardarlo en
// ManualStampingRecordsStore en vez de persistirlo (igual que saveSKU).
@Component({
  selector: 'app-stamping-record-manual',
  standalone: true,
  imports: [
    BoxLayout, UiButton, UiIcon, UiTabs, ShiftCyclesFab, Searcher,
    AdditionalStampingTimeCard, StampingReferenceCard, StampingQuantityCounter, UiLabelButton,
    ReactiveFormsModule, UiFormField, UiLargeInput, UiErrorMessage,
  ],
  templateUrl: '../stamping-record/stamping-record.html',
})
export class StampingRecordManual extends StampingRecord implements OnChanges {
  protected override showWindowStatus = false;
  protected override saveButtonLabel = 'Aceptar';

  ngOnChanges(): void {
    this.inWindow = true;
  }
}
