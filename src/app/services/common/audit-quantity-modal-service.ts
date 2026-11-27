import { Injectable, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { BehaviorSubject } from 'rxjs';
import { ProductionOrder } from '../../models/production/production-order';

@Injectable({
  providedIn: 'root',
})
export class AuditQuantityModalService {
  private visibleSubject = new BehaviorSubject<boolean>(false);
  visible = toSignal(this.visibleSubject.asObservable(), { initialValue: false });
  productionOrder = signal<ProductionOrder | null>(null);

  // The modal only ever audits one color at a time.
  color = signal<string | null>(null);

  // Non-null when that color already has an audited quantity — prefills the
  // form and switches the modal's copy/labels into "edit" mode.
  existingQuantity = signal<number | null>(null);

  // Already-saved meters of that color (CALANDRA only), used to prefill the meters field.
  existingMeters = signal<number | null>(null);

  open(productionOrder: ProductionOrder, color: string, existingQuantity: number | null = null, existingMeters: number | null = null) {
    this.productionOrder.set(productionOrder);
    this.color.set(color);
    this.existingQuantity.set(existingQuantity);
    this.existingMeters.set(existingMeters);
    this.visibleSubject.next(true);
  }

  close() {
    this.visibleSubject.next(false);
    this.productionOrder.set(null);
    this.color.set(null);
    this.existingQuantity.set(null);
    this.existingMeters.set(null);
  }
}
