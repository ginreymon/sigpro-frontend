import { Directive, EventEmitter, Input, Output, signal } from '@angular/core';
import { DialogService } from '../../services/common/dialog-service';

@Directive()
export abstract class ModalBase {
  protected openModal = signal(false);

  @Input() title: string | null = null;
  @Input() message: string | null = null;

  @Output() onAccept = new EventEmitter<void>();
  @Output() onCancel = new EventEmitter<void>();

  @Input() hideCancel: boolean = false;
  @Input() hideAccept: boolean = false;

  @Input() cancelLabel: string | null = null;
  @Input() acceptLabel: string | null = null;

  @Input() formId: string | null = null;

  get submit(): boolean {
    return !!this.formId
  }

  @Input() set visible(value: boolean) {
    this.openModal.set(value);
  }

  constructor(protected dialogService: DialogService) { }

  close() {
    this.openModal.set(false);
    this.dialogService.closeModal();
    this.onCancel.emit();
  }

  closeConfirm() {
    this.openModal.set(false);
    this.dialogService.closeConfirm();
    this.onCancel.emit();
  }

  closeToast() {
    this.openModal.set(false);
    this.dialogService.closeToast();
    this.onCancel.emit();
  }

  accept() {
    this.onAccept.emit();
  }
}
