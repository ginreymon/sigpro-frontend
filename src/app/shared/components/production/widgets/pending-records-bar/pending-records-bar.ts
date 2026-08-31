import { Component, computed, EventEmitter, inject, Output } from '@angular/core';
import { ManualProductionRecordsStore } from '../../../../../services/production/manual-production-records-store';
import { ProductionRecord } from '../../../../../models/production/production-record';

// Barra flotante que resume los registros manuales capturados en
// shift-cycles-manual (ManualProductionRecordsStore) — solo visible
// mientras haya al menos uno pendiente, ya que ese flujo no persiste al
// guardar (ver quantity-duration-modal.ts / ShiftCyclesManual.saveSKU).
// Mismo tratamiento fixed + z-index que app-shift-time-alert.
@Component({
  selector: 'app-pending-records-bar',
  standalone: true,
  imports: [],
  templateUrl: './pending-records-bar.html',
  styleUrl: './pending-records-bar.css',
})
export class PendingRecordsBar {
  private store = inject(ManualProductionRecordsStore);

  protected visible = computed(() => this.store.records().length > 0);
  protected pendingCount = computed(() => this.store.records().length);
  protected totalUnits = computed(() =>
    this.store.records().reduce((sum, r) => sum + Number(r.completed_quantity ?? 0), 0)
  );

  @Output() onSave = new EventEmitter<Partial<ProductionRecord>[]>();

  protected save(): void {
    this.onSave.emit(this.store.records());
  }
}
