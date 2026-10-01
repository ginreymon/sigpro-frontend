import { Component, EventEmitter, Input, Output } from '@angular/core';
import { OrderToBeOutboundDetail } from '../../../../models/integration/order-to-be-outbound';

@Component({
  selector: 'app-op-totals-table',
  imports: [],
  templateUrl: './op-totals-table.html',
  styleUrl: './op-totals-table.css',
})
export class OpTotalsTable {
  @Input() detail: OrderToBeOutboundDetail[] = [];
  // Horas digitadas por op_rowid. El padre las guarda y las vuelve a pasar,
  // así varias instancias de la tabla muestran los mismos valores.
  @Input() hours: Partial<Record<number, string>> = {};
  @Output() hoursChange = new EventEmitter<Partial<Record<number, string>>>();

  protected setHours(opRowid: number, value: string): void {
    this.hoursChange.emit({ ...this.hours, [opRowid]: value });
  }
}
