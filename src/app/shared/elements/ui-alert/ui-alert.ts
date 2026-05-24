import { Component, EventEmitter, Input, Output } from '@angular/core';
import { UiCloseButton } from '../ui-close-button/ui-close-button';
import { UiIcon } from '../ui-icon/ui-icon';

export type UiAlertIntent = 'error' | 'success';

@Component({
  selector: 'app-ui-alert',
  standalone: true,
  imports: [UiCloseButton, UiIcon],
  templateUrl: './ui-alert.html',
  host: { class: 'block w-full' },
})
export class UiAlert {
  @Input() intent: UiAlertIntent = 'error';
  @Input() message: string | null = null;
  @Output() onClose = new EventEmitter<void>();

  private readonly _intents: Record<UiAlertIntent, { classes: string; icon: string; closeClass: string }> = {
    error: {
      classes: 'text-red-700 bg-red-100 border-red-200',
      icon: 'triangleExclamation',
      closeClass: 'border-red-700 text-red-700 hover:bg-red-200',
    },
    success: {
      classes: 'text-green-700 bg-green-100 border-green-200',
      icon: 'check',
      closeClass: 'border-green-700 text-green-700 hover:bg-green-200',
    },
  };

  get classes(): string {
    return this._intents[this.intent].classes;
  }

  get icon(): string {
    return this._intents[this.intent].icon;
  }

  get closeClass(): string {
    return this._intents[this.intent].closeClass;
  }

  close(): void {
    this.onClose.emit();
  }
}
