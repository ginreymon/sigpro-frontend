import { Injectable } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class PauseModalService {
  private visibleSubject = new BehaviorSubject<boolean>(false);
  private activityIdSubject = new BehaviorSubject<number | null>(null);

  visible$ = this.visibleSubject.asObservable();
  visible = toSignal(this.visibleSubject, { initialValue: false });
  activeActivityId = toSignal(this.activityIdSubject, { initialValue: null });

  open(activityId?: number | null) {
    this.activityIdSubject.next(activityId ?? null);
    this.visibleSubject.next(true);
  }

  close() {
    this.visibleSubject.next(false);
  }
}
