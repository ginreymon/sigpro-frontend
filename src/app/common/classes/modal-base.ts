import { Directive, EventEmitter, Input, Output, signal } from '@angular/core';

@Directive()
export abstract class ModalBase {
  protected openModal = signal(false);

  @Input() title: string | null = null;
  @Input() message: string | null = null;

  @Output() onAccept = new EventEmitter<void>();
  @Output() onCancel = new EventEmitter<void>();

  @Input() set visible(value: boolean) {
    this.openModal.set(value);
  }

  close() {
    this.openModal.set(false);
    this.onCancel.emit();
  }

  accept() {
    this.openModal.set(false);
    this.onAccept.emit();
  }
}
