import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { IDialogService } from '../../common/interfaces/idialog-service';

@Injectable({
  providedIn: 'root',
})
export class DialogService implements IDialogService {

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

  openModal(title?: string, acceptLabel?: string, confirmCallback?: () => void) {
    this.closeAll();
    this.title = title ?? null;
    this.acceptLabel = acceptLabel ?? null;
    this.confirmCallback = confirmCallback ?? null;
    this.modalVisibleSubject.next(true);
    this.sideModalVisibleSubject.next(false);
  }

  openSideModal(title?: string, acceptLabel?: string) {
    this.closeAll();
    this.title = title ?? null;
    this.acceptLabel = acceptLabel ?? null;
    this.sideModalVisibleSubject.next(true);
    this.modalVisibleSubject.next(false);
  }

  openConfirm(title: string, message: string, acceptLabel?: string, confirmCallback?: () => void) {
    this.closeAll();
    this.title = title;
    this.message = message;
    this.acceptLabel = acceptLabel ?? null;
    this.confirmCallback = confirmCallback ?? null;
    this.confirmVisibleSubject.next(true);
  }

  openToast(title: string, message: string, iconName?: string, duration?: number) {
    this.closeAll();
    this.title = title;
    this.message = message;
    this.iconName = iconName ?? '';
    this.toastVisibleSubject.next(true);
    const seconds = duration ?? 5000;
    setTimeout(() => {
      this.closeToast();
    }, seconds);
  }

  private closeAll() {
    this.closeConfirm();
    this.closeModal();
    this.closeToast();
  }

  closeModal() {
    this.modalVisibleSubject.next(false);
    this.sideModalVisibleSubject.next(false);
    this.toastVisibleSubject.next(false);
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

  closeToast() {
    this.title = null;
    this.message = null;
    this.iconName = null;
    this.toastVisibleSubject.next(false);
  }
}
