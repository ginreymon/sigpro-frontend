import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class DialogService {
  
  title: string | null = null;
  message: string | null = null;
  iconName: string | null = null;
  acceptLabel: string | null = null;
  confirmCallback: (() => void) | null = null;

  private modalVisibleSubject = new BehaviorSubject<boolean>(false);
  modalVisible$ = this.modalVisibleSubject.asObservable();

  private sideModalVisibleSubject = new BehaviorSubject<boolean>(false);
  sideModalVisible$ = this.sideModalVisibleSubject.asObservable();

  private confirmVisibleSubject = new BehaviorSubject<boolean>(false);
  confirmVisible$ = this.confirmVisibleSubject.asObservable();

  private toastVisibleSubject = new BehaviorSubject<boolean>(false);
  toastVisible$ = this.toastVisibleSubject.asObservable();

  openModal(title?: string, acceptLabel?: string) {
    if (title) {
      this.title = title;
    }
    if (acceptLabel) {
      this.acceptLabel = acceptLabel;
    }
    this.modalVisibleSubject.next(true);
    this.sideModalVisibleSubject.next(false);
  }

  openSideModal(title?: string, acceptLabel?: string) {
    if (title) {
      this.title = title;
    }
    if (acceptLabel) {
      this.acceptLabel = acceptLabel;
    }
    this.sideModalVisibleSubject.next(true);
    this.modalVisibleSubject.next(false);
  }

  closeModal() {
    this.modalVisibleSubject.next(false);
    this.sideModalVisibleSubject.next(false);
    this.title = null;
    this.message = null;
    this.acceptLabel = null;
  }

  closeConfirm() {
    this.confirmVisibleSubject.next(false);
    this.title = null;
    this.message = null;
    this.confirmCallback = null;
    this.acceptLabel = null;
  }

  openConfirm(title: string, message: string, acceptLabel?: string, confirmCallback?: () => void) {
    this.title = title;
    this.message = message;
    if (acceptLabel) {
      this.acceptLabel = acceptLabel;
    }
    if (confirmCallback) {
      this.confirmCallback = confirmCallback;
    }
    this.confirmVisibleSubject.next(true);
  }

  openToast(title: string, message: string, iconName?: string) {
    this.title = title;
    this.message = message;
    this.iconName = iconName ?? '';
    this.toastVisibleSubject.next(true);
  }

  closeToast() {
    this.title = null;
    this.message = null;
    this.iconName = null;
    this.toastVisibleSubject.next(false);
  }
}
