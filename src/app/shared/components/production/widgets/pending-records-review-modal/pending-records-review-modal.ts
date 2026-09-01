import { Component, EventEmitter, Input, Output } from '@angular/core';
import { BoxLayout } from '../../../layout/box-layout/box-layout';
import { UiButton } from '../../../../elements/ui-button/ui-button';
import { UiIcon } from '../../../../elements/ui-icon/ui-icon';
import { ProductionRecord } from '../../../../../models/production/production-record';
import { StampingRecord } from '../../../../../models/stamping/stamping-record';

// Shape mínimo para las dos variantes que usa este modal — ver `variant`.
export type PendingReviewRecord = Partial<ProductionRecord> & Partial<StampingRecord>;

// Siguiente en app-duration-schedule-modal (ver ShiftCyclesManual) y lista
// en tabla los registros acumulados en ManualProductionRecordsStore /
// ManualStampingRecordsStore antes de confirmar. El guardado real
// (persistir vía API) todavía no está definido para estampación — Confirmar
// dispara el mismo placeholder que antes disparaba directamente el paso de
// horario.
@Component({
  selector: 'app-pending-records-review-modal',
  standalone: true,
  imports: [BoxLayout, UiButton, UiIcon],
  templateUrl: './pending-records-review-modal.html',
})
export class PendingRecordsReviewModal {
  @Input() visible = false;
  @Input() records: PendingReviewRecord[] = [];
  @Input() schedule: { start_time: string; end_time: string; duration_seconds: number } | null = null;

  // 'production' muestra completadas/saldos/bajas (ProductionRecord);
  // 'stamping' muestra cantidad/tiempos adicionales (StampingRecord) — ver
  // los dos usos de este modal en shift-cycles-manual.html.
  @Input() variant: 'production' | 'stamping' = 'production';

  // id de AdditionalStampingTime -> standard_time (minutos por unidad, mismo
  // criterio que app-additional-stamping-time-card) — el registro pendiente
  // solo trae {id, count}, así que el minutaje se resuelve contra este
  // catálogo (ver ShiftCyclesManual.additionalTimeMinutes).
  @Input() additionalTimeMinutes: Record<number, number> = {};

  @Output() onConfirm = new EventEmitter<void>();
  @Output() onCancel = new EventEmitter<void>();

  // Índice dentro de `records` — el llamador (ShiftCyclesManual) lo pasa
  // directo a ManualProductionRecordsStore.removeAt() / ManualStampingRecordsStore.removeAt().
  @Output() onRemove = new EventEmitter<number>();

  protected additionalTimesMinutes(record: PendingReviewRecord): number {
    const total = (record.additional_times ?? []).reduce(
      (sum, item) => sum + (this.additionalTimeMinutes[item.id] ?? 0) * item.count,
      0,
    );
    return Math.round(total * 100) / 100;
  }

  protected get totalUnits(): number {
    return this.records.reduce(
      (sum, r) => sum + Number(r.completed_quantity ?? 0) + Number(r.rejected_quantity ?? 0) + Number(r.scrap_quantity ?? 0),
      0,
    );
  }
}
