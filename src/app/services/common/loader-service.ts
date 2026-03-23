import { Injectable } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class LoaderService {
  private loaderVisibleSubject = new BehaviorSubject<boolean>(false);
  loaderVisible$ = this.loaderVisibleSubject.asObservable();

  loaderVisible = toSignal(this.loaderVisibleSubject.asObservable(), {
    initialValue: false,
  });

  showLoader() {
    this.loaderVisibleSubject.next(true);
  }

  hideLoader() {
    this.loaderVisibleSubject.next(false);
  }
}
