import { Component, EventEmitter, Input, Output } from '@angular/core';
import { BoxLayout } from '../../../layout/box-layout/box-layout';
import { UiButton } from '../../../../elements/ui-button/ui-button';
import { UiIcon } from '../../../../elements/ui-icon/ui-icon';
import { ProductionRecord } from '../../../../../models/production/production-record';

// Paso final del guardado por lote en shift-cycles-manual: sale al pulsar
// Siguiente en app-duration-schedule-modal (ver ShiftCyclesManual) y lista
// en tabla los registros acumulados en ManualProductionRecordsStore antes
// de confirmar. El guardado real (persistir vía API) todavía no está
// definido — Confirmar dispara el mismo placeholder que antes disparaba
// directamente el paso de horario.
@Component({
  selector: 'app-pending-records-review-modal',
  standalone: true,
  imports: [BoxLayout, UiButton, UiIcon],
  templateUrl: './pending-records-review-modal.html',
})
export class PendingRecordsReviewModal {
  @Input() visible = false;
  @Input() records: Partial<ProductionRecord>[] = [];
  @Input() schedule: { start_time: string; end_time: string; duration_seconds: number } | null = null;

  @Output() onConfirm = new EventEmitter<void>();
  @Output() onCancel = new EventEmitter<void>();

  // Índice dentro de `records` — el llamador (ShiftCyclesManual) lo pasa
  // directo a ManualProductionRecordsStore.removeAt().
  @Output() onRemove = new EventEmitter<number>();

  protected get totalUnits(): number {
    return this.records.reduce(
      (sum, r) => sum + Number(r.completed_quantity ?? 0) + Number(r.rejected_quantity ?? 0) + Number(r.scrap_quantity ?? 0),
      0,
    );
  }
}
