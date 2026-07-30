import { Injectable, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { BehaviorSubject } from 'rxjs';
import { ProductionOrder } from '../../models/production/production-order';
import { AuditRecord } from '../../models/stamping/audit-record';

@Injectable({
  providedIn: 'root',
})
export class AuditQuantityModalService {
  private visibleSubject = new BehaviorSubject<boolean>(false);
  visible = toSignal(this.visibleSubject.asObservable(), { initialValue: false });
  productionOrder = signal<ProductionOrder | null>(null);

  // Present only when opened from the "Auditoría" tab's edit action — prefills
  // the form with the OP's already-audited quantities and switches the modal
  // into replace-the-block mode instead of create.
  existingRecords = signal<AuditRecord[]>([]);

  // Set when opened from a single row's edit icon — restricts the form to
  // that one color instead of the whole OP's color set.
  editingColor = signal<string | null>(null);

  open(productionOrder: ProductionOrder, existingRecords: AuditRecord[] = [], editingColor: string | null = null) {
    this.productionOrder.set(productionOrder);
    this.existingRecords.set(existingRecords);
    this.editingColor.set(editingColor);
    this.visibleSubject.next(true);
  }

  close() {
    this.visibleSubject.next(false);
    this.productionOrder.set(null);
    this.existingRecords.set([]);
    this.editingColor.set(null);
  }
}
