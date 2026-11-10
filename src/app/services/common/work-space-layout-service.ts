import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class WorkSpaceLayoutService {
  private showHeaderSubject = new BehaviorSubject<boolean>(true);
  showHeader$ = this.showHeaderSubject.asObservable();

  showHeader() {
    this.showHeaderSubject.next(true);
  }

  toggleHeader() {
    this.showHeaderSubject.next(!this.showHeaderSubject.value);
  }
}
