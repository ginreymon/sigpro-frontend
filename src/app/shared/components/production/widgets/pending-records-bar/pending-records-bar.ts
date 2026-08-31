import { Component, computed, EventEmitter, inject, Output } from '@angular/core';
import { ManualProductionRecordsStore } from '../../../../../services/production/manual-production-records-store';
import { ProductionRecord } from '../../../../../models/production/production-record';
import { UiIcon } from '../../../../elements/ui-icon/ui-icon';
import { UiButton } from '../../../../elements/ui-button/ui-button';

// Barra flotante que resume los registros manuales capturados en
// shift-cycles-manual (ManualProductionRecordsStore) — siempre montada,
// pero solo entra en pantalla mientras haya al menos un registro pendiente
// (ese flujo no persiste al guardar; ver quantity-duration-modal.ts /
// ShiftCyclesManual.saveSKU), animando su entrada/salida en vez de
// aparecer/desaparecer abruptamente (@if la desmontaría y no podría
// transicionar la salida). Mismo tratamiento z-index que app-shift-time-alert.
@Component({
  selector: 'app-pending-records-bar',
  standalone: true,
  imports: [UiIcon, UiButton],
  templateUrl: './pending-records-bar.html',
  styleUrl: './pending-records-bar.css',
})
export class PendingRecordsBar {
  private store = inject(ManualProductionRecordsStore);

  protected visible = computed(() => this.store.records().length > 0);
  protected pendingCount = computed(() => this.store.records().length);
  protected totalUnits = computed(() =>
    this.store.records().reduce(
      (sum, r) => sum + Number(r.completed_quantity ?? 0) + Number(r.scrap_quantity ?? 0) + Number(r.rejected_quantity ?? 0),
      0,
    )
  );

  @Output() onSave = new EventEmitter<Partial<ProductionRecord>[]>();

  protected save(): void {
    this.onSave.emit(this.store.records());
  }
}
