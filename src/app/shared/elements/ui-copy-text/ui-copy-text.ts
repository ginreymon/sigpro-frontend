import { Component, inject, input } from '@angular/core';
import { DialogService } from '../../../services/common/dialog-service';
import { UiIcon } from '../ui-icon/ui-icon';

// Shows its text with a copy icon; clicking anywhere on it copies the text to the clipboard.
@Component({
  selector: 'app-ui-copy-text',
  imports: [UiIcon],
  templateUrl: './ui-copy-text.html',
})
export class UiCopyText {
  private dialogService = inject(DialogService);

  readonly text = input.required<string>();

  protected async copy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.text());
      this.dialogService.openToast('Copiado', this.text(), 'check');
    } catch {
      // The Clipboard API needs a secure context (https/localhost) and user permission.
      this.dialogService.openToast('Aviso', 'No se pudo copiar el texto.', 'fail');
    }
  }
}
