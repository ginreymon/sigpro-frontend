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

  open(productionOrder: ProductionOrder) {
    this.productionOrder.set(productionOrder);
    this.visibleSubject.next(true);
  }

  close() {
    this.visibleSubject.next(false);
    this.productionOrder.set(null);
  }
}
