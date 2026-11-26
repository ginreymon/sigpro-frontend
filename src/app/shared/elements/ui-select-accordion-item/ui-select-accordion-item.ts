import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { UiIcon } from '../ui-icon/ui-icon';

let nextId = 0;

/**
 * Single-choice option whose details are collapsed by default.
 * The row selects (radio semantics); the chevron expands/collapses the body.
 * Project the summary in `[item-header]` and the details in `[item-body]`.
 */
@Component({
  selector: 'app-ui-select-accordion-item',
  imports: [UiIcon],
  templateUrl: './ui-select-accordion-item.html',
  styleUrl: './ui-select-accordion-item.css',
})
export class UiSelectAccordionItem {
  @Input() selected = false;
  @Input() disabled = false;
  @Input() expandLabel = 'Ver detalle';
  @Output() onSelect = new EventEmitter<void>();

  readonly expanded = signal(false);
  protected readonly bodyId = `ui-select-accordion-body-${nextId++}`;
}
