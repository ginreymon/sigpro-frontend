import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-ui-button',
  imports: [],
  templateUrl: './ui-button.html',
  styleUrl: './ui-button.css',
})
export class UiButton {
  @Input() intent: string = 'accept';
  @Output() onClick = new EventEmitter<void>();

  intents: Record<string, string> = {
    cancel: 'text-gray-600 hover:bg-gray-100',
    accept: 'bg-brand-400 text-white hover:bg-brand-600',
  };

  clickHandle() {
    this.onClick.emit();
  }
}
