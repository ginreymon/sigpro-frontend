import { Directive, EventEmitter, Input, Output } from '@angular/core';

@Directive()
export abstract class ButtonBase {
  @Input() intent: 'hover' | 'cancel' | 'accept' | 'action' | 'black' | 'label' = 'accept';
  @Input() disabled: boolean = false;
  @Input() classNames: string = '';
  @Input() type: string = 'button';
  @Input() formId: string | null = null;
  
  @Output() onClick = new EventEmitter<void>();

  constructor() {}

  intents: Record<string, string> = {
    hover: 'border-0 text-gray-600 hover:bg-gray-100',
    cancel: 'text-gray-600 hover:bg-gray-100',
    accept: 'text-white bg-brand-400 hover:bg-brand-600',
    action: 'text-gray-700 bg-gray-200 hover:bg-gray-300',
    label: 'hover:bg-brand-200 hover:text-brand-900 text-brand-700 bg-brand-100',
    black: 'text-white bg-black hover:bg-gray-700',
  };

  clickHandler() {
    if (this.disabled) return;
    this.onClick.emit();
  }
}
