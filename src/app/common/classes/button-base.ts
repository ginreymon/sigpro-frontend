import { Directive, EventEmitter, Input, Output } from '@angular/core';

export type ButtonBaseType ='hover' | 'cancel' | 'accept' | 'action' | 'black' | 'label';

@Directive()
export abstract class ButtonBase {
  @Input() intent: ButtonBaseType = 'accept';
  @Input() disabled: boolean = false;
  @Input() classNames: string = '';
  @Input() type: string = 'button';
  @Input() formId: string | null = null;

  @Output() onClick = new EventEmitter<void>();

  constructor() {}

  private _intents: Record<string, string> = {
    hover: 'border-0 text-gray-600 hover:bg-gray-100',
    cancel: 'text-gray-600 hover:bg-gray-100',
    accept: 'text-white bg-brand-400 hover:bg-brand-600',
    action: 'text-gray-700 bg-gray-200 hover:bg-gray-300',
    label: 'hover:bg-brand-200 hover:text-brand-900 text-brand-700 bg-brand-100',
    black: 'text-white bg-black hover:bg-gray-700',
  };

  get intents(): Record<string, string> {
    const result: Record<string, string> = {};

    if (!this.disabled) return this._intents;

    for (const key in this._intents) {
      result[key] = this._intents[key].replace(/\bhover:[^\s]+/g, '').trim();
    }

    return result;
  }

  clickHandler() {
    if (this.disabled) return;
    this.onClick.emit();
  }
}
