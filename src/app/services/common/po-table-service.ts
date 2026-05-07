import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class PoTableService {
  private taskTimerVisibleSubject = new BehaviorSubject<boolean>(false);
  taskTimerVisible$ = this.taskTimerVisibleSubject.asObservable();
}
