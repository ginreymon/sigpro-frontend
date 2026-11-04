import { Component, inject, input, signal } from '@angular/core';
import { DialogService } from '../../../services/common/dialog-service';
import { UiIcon } from '../ui-icon/ui-icon';
import { UiTooltipFixed } from '../ui-tooltip-fixed/ui-tooltip-fixed';

// Shows its text (with an optional copy icon); clicking anywhere on it copies the text to the clipboard,
// swaps the icon for a check mark briefly and confirms with a toast.
@Component({
  selector: 'app-ui-copy-text',
  imports: [UiIcon, UiTooltipFixed],
  templateUrl: './ui-copy-text.html',
})
export class UiCopyText {
  private dialogService = inject(DialogService);

  readonly text = input.required<string>();
  readonly showIcon = input(true);
  // Success toast on copy; the error toast is always shown so a failed copy is never silent.
  readonly showToast = input(true);

  protected copied = signal(false);

  protected async copy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.text());
      if (this.showToast()) this.dialogService.openToast('Copiado', this.text(), 'check');
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 1500);
    } catch {
      // The Clipboard API needs a secure context (https/localhost) and user permission.
      this.dialogService.openToast('Aviso', 'No se pudo copiar el texto.', 'fail');
    }
  }
}
