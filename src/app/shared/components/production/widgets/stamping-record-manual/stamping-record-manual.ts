import { Component, inject, OnChanges } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { BoxLayout } from '../../../layout/box-layout/box-layout';
import { UiButton } from '../../../../elements/ui-button/ui-button';
import { UiIcon } from '../../../../elements/ui-icon/ui-icon';
import { UiMultiStepForm } from '../../../../elements/ui-multi-step-form/ui-multi-step-form';
import { UiStep, UiSummary } from '../../../../elements/ui-multi-step-form/ui-step.directive';
import { WindowStatus } from '../../../widgets/window-status/window-status';
import { TimeProgressCircle } from '../../../widgets/time-progress-circle/time-progress-circle';
import { ReferenceTab } from '../stamping-record/tabs/reference-tab/reference-tab';
import { QuantitiesTab } from '../stamping-record/tabs/quantities-tab/quantities-tab';
import { AdditionalTimesTab } from '../stamping-record/tabs/additionaltimes-tab/additionaltimes-tab';
import { StampingRecord } from '../stamping-record/stamping-record';
import { StampingRecordDataService } from '../stamping-record/stamping-record-data-service';
import { StampingReferenceSam } from '../../../../../models/stamping/stamping-reference-sam';
import { ManualStampingRecordsStore } from '../../../../../services/stamping/manual-stamping-records-store';

// Variante de app-stamping-record para shift-cycles-manual (módulos con
// allows_production_time_adjustment=true): mismo template y validaciones —
// hereda todo tal cual de StampingRecord (mismo patrón que
// app-quantity-duration-modal extiende app-quantity-modal), casi sin
// modificar StampingRecord. La única diferencia es que el registro no
// depende de STAMPING_CAL_WINDOW: ese flujo no tiene ventana horaria propia,
// a diferencia del registro en tiempo real de estampación — se fuerza
// inWindow=true en cada cambio de inputs (ver ngOnChanges), sin importar lo
// que el llamador (app-shift-cycles-manual) le pase. register() se hereda
// tal cual: sigue emitiendo onSave con el payload normal — es
// ShiftCyclesManual.saveStamping quien decide guardarlo en
// ManualStampingRecordsStore en vez de persistirlo (igual que saveSKU).
@Component({
  selector: 'app-stamping-record-manual',
  standalone: true,
  imports: [
    BoxLayout, UiButton, UiIcon, UiMultiStepForm, UiStep, UiSummary, TimeProgressCircle, WindowStatus, ReactiveFormsModule,
    ReferenceTab, QuantitiesTab, AdditionalTimesTab,
  ],
  providers: [StampingRecordDataService],
  templateUrl: '../stamping-record/stamping-record.html',
})
export class StampingRecordManual extends StampingRecord implements OnChanges {
  protected override showWindowStatus = false;
  protected override forecastEnabled = false;
  protected override saveButtonLabel = 'Agregar';

  private manualStampingRecordsStore = inject(ManualStampingRecordsStore);

  ngOnChanges(): void {
    this.inWindow = true;
  }

  // Como este flujo no persiste (ver comentario de arriba), el backend nunca
  // se entera de lo ya registrado en esta sesión — pending_qty/stamped_qty
  // de dataService.referenceSams() se quedan en el valor con el que cargó el
  // modal. Se resta aquí, en el navegador, lo que ya está en
  // ManualStampingRecordsStore para esta misma OP, así "cantidad que falta
  // para completar la referencia" (stamping-reference-card, y
  // totalPendingQuantity/totalStampedQuantity) se ve igual que en el flujo
  // real de app-shift-cycles.
  protected override referenceSamsSnapshot(): StampingReferenceSam[] {
    const base = super.referenceSamsSnapshot();
    const order = this.dataService.orderDetail();
    if (!order) return base;

    const stagedByReference = new Map<number, number>();
    for (const record of this.manualStampingRecordsStore.records()) {
      if (record.op_type !== order.documentType || record.op_number !== order.documentNumber) continue;
      if (record.stamping_reference_sam == null) continue;
      const current = stagedByReference.get(record.stamping_reference_sam) ?? 0;
      stagedByReference.set(record.stamping_reference_sam, current + (Number(record.completed_quantity) || 0));
    }
    if (stagedByReference.size === 0) return base;

    return base.map((sam) => {
      const staged = stagedByReference.get(sam.id);
      if (!staged) return sam;
      return {
        ...sam,
        pending_qty: Math.max(0, Number(sam.pending_qty ?? 0) - staged),
        stamped_qty: Number(sam.stamped_qty ?? 0) + staged,
      };
    });
  }
}
