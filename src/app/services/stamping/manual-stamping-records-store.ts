import { Injectable, signal } from '@angular/core';
import { StampingRecord } from '../../models/stamping/stamping-record';

// Estado global en memoria (no persiste) para los registros de estampación
// capturados en shift-cycles-manual: ese flujo no llama a ningún endpoint al
// guardar (ver ShiftCyclesManual.saveStamping), así que aquí se acumulan con
// la misma forma que tendría el POST a /api/v1/stamping/stamping-records/ el
// día que se conecte el guardado real. Mismo patrón que
// ManualProductionRecordsStore, para el flujo de estampación.
@Injectable({ providedIn: 'root' })
export class ManualStampingRecordsStore {
  private readonly _records = signal<Partial<StampingRecord>[]>([]);
  readonly records = this._records.asReadonly();

  add(record: Partial<StampingRecord>): void {
    this._records.update((records) => [...records, record]);
  }

  removeAt(index: number): void {
    this._records.update((records) => records.filter((_, i) => i !== index));
  }

  clear(): void {
    this._records.set([]);
  }
}
