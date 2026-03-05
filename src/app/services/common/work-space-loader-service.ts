import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class WorkSpaceLoaderService {
  private isLoadingSubject = new BehaviorSubject<boolean>(false);
  isLoading$ = this.isLoadingSubject.asObservable();

  private showFullHeightSubject = new BehaviorSubject<boolean>(true);
  showFullHeight$ = this.showFullHeightSubject.asObservable();

  start() {
    this.isLoadingSubject.next(true);
  }

  end() {
    this.isLoadingSubject.next(false);
  }

  toggleFullHeight() {
    this.showFullHeightSubject.next(!this.showFullHeightSubject.value);
  }
}
