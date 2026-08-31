import { Injectable, signal } from '@angular/core';
import { ProductionRecord } from '../../models/production/production-record';

// Estado global en memoria (no persiste) para los registros capturados en
// shift-cycles-manual: ese flujo no llama a ningún endpoint al guardar (ver
// quantity-duration-modal.ts / ShiftCyclesManual.saveSKU), así que aquí se
// acumulan con la misma forma que tendría el POST a
// /api/v1/production/production-records/ el día que se conecte el guardado
// real. app-production-orders-table los usa (vía applyPendingRecords) para
// reflejar en el navegador las cantidades recién "guardadas" sin volver a
// pedirle la orden al backend.
@Injectable({ providedIn: 'root' })
export class ManualProductionRecordsStore {
  private readonly _records = signal<Partial<ProductionRecord>[]>([]);
  readonly records = this._records.asReadonly();

  add(record: Partial<ProductionRecord>): void {
    this._records.update((records) => [...records, record]);
  }

  removeAt(index: number): void {
    this._records.update((records) => records.filter((_, i) => i !== index));
  }

  clear(): void {
    this._records.set([]);
  }
}
