import { Directive, EventEmitter, Input, Output, Signal, signal } from '@angular/core';
import { DialogService } from '../../services/common/dialog-service';
import { IDialogService } from '../interfaces/idialog-service';

@Directive()
export abstract class ModalBase implements IDialogService {
  private localVisible = signal(false);
  protected serviceVisible?: Signal<boolean>;

  private _title: string | null = null;
  private _message: string | null = null;
  private _iconName: string | null = null;
  private _acceptLabel: string | null = null;

  @Input() hideCancel: boolean = false;
  @Input() hideAccept: boolean = false;
  @Input() cancelLabel: string | null = null;
  @Input() formId: string | null = null;

  @Output() onAccept = new EventEmitter<void>();
  @Output() onCancel = new EventEmitter<void>();

  @Input()
  set title(value: string | null) {
    this._title = value;
  }

  @Input()
  set message(value: string | null) {
    this._message = value;
  }

  @Input()
  set iconName(value: string | null) {
    this._iconName = value;
  }

  @Input()
  set acceptLabel(value: string | null) {
    this._acceptLabel = value;
  }

  @Input()
  set visible(value: boolean) {
    this.localVisible.set(value);
  }

  constructor(protected dialogService: DialogService) { }

  // Components like SideModalLayout stay mounted (CSS-only slide transition)
  // even while closed, so they must not keep reading dialogService's shared
  // state — otherwise an unrelated modal/confirm/toast opened elsewhere
  // leaks its title/label into this instance. Only read it while this
  // instance is actually the one open.

  get title() {
    return this._title ?? (this.openModal() ? this.dialogService.title : null);
  }

  get message() {
    return this._message ?? (this.openModal() ? this.dialogService.message : null);
  }

  get iconName() {
    return this._iconName ?? (this.openModal() ? this.dialogService.iconName : null);
  }

  get acceptLabel() {
    return this._acceptLabel ?? (this.openModal() ? this.dialogService.acceptLabel : null);
  }

  get confirmCallback(): () => void {
    return (this.openModal() ? this.dialogService.confirmCallback : null) ?? (() => { });
  }

  get submit(): boolean {
    return !!this.formId
  }

  openModal() {
    return this.localVisible() || this.serviceVisible?.() || false;
  }

  close() {
    this.localVisible.set(false);
    this.dialogService.closeModal();
    this.onCancel.emit();
  }

  closeConfirm() {
    this.localVisible.set(false);
    this.dialogService.closeConfirm();
    this.onCancel.emit();
  }

  closeToast() {
    this.localVisible.set(false);
    this.dialogService.closeToast();
    this.onCancel.emit();
  }

  accept() {
    this.onAccept.emit();
    this.confirmCallback?.();
  }
}
