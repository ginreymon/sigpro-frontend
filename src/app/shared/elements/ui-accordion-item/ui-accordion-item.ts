import { Component, EventEmitter, Input, Output } from '@angular/core';
import { UiIcon } from '../ui-icon/ui-icon';

@Component({
  selector: 'app-ui-accordion-item',
  imports: [UiIcon],
  templateUrl: './ui-accordion-item.html',
  styleUrl: './ui-accordion-item.css',
})
export class UiAccordionItem {
  @Input() expanded = false;
  @Output() toggle = new EventEmitter<void>();
}
