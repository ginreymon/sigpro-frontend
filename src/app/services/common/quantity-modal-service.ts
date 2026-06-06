import { Injectable, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { BehaviorSubject } from 'rxjs';
import { ProductionRecordContext } from '../../models/production/production-record-context';

@Injectable({
  providedIn: 'root',
})
export class QuantityModalService {
  private visibleSubject = new BehaviorSubject<boolean>(false);
  visible$ = this.visibleSubject.asObservable();
  visible = toSignal(this.visibleSubject.asObservable(), { initialValue: false });
  editRecord = signal<ProductionRecordContext | null>(null);  

  open() {
    this.visibleSubject.next(true);
  }

  openForEdit(record: ProductionRecordContext) {
    this.editRecord.set(record);    
    this.open();
  }

  close() {
    this.editRecord.set(null); 
    this.visibleSubject.next(false);
  }
}
