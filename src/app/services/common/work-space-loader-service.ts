import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class WorkSpaceLoaderService {
  private isLoadingSubject = new BehaviorSubject<boolean>(false);
  private activeRequests = 0;

  isLoading$ = this.isLoadingSubject.asObservable();

  start() {
    this.activeRequests++;
    this.isLoadingSubject.next(true);
  }

  end() {
    this.activeRequests = Math.max(0, this.activeRequests - 1);
    this.isLoadingSubject.next(this.activeRequests > 0);
  }
}
