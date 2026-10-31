import { Component, Input, signal } from '@angular/core';

// 'default' inherits the surrounding font color; the others reuse the badge palette.
export type DisclosureIntent = 'default' | 'brand' | 'active' | 'paused' | 'warning' | 'danger';

// Collapsed by default: a title with a count and a rotating arrow that reveals a list of texts.
@Component({
  selector: 'app-ui-disclosure',
  imports: [],
  templateUrl: './ui-disclosure.html',
})
export class UiDisclosure {
  @Input() title: string = '';
  @Input() items: (string | number)[] = [];
  @Input() intent: DisclosureIntent = 'default';

  protected expanded = signal(false);

  private readonly _intents: Record<DisclosureIntent, string> = {
    default: 'text-current',
    brand: 'text-brand-600 group-hover:text-brand-700',
    active: 'text-green-600 group-hover:text-green-700',
    paused: 'text-orange-600 group-hover:text-orange-700',
    warning: 'text-amber-600 group-hover:text-amber-700',
    danger: 'text-red-600 group-hover:text-red-700',
  };

  get arrowClass(): string {
    return this._intents[this.intent];
  }

  protected toggle(): void {
    this.expanded.update((value) => !value);
  }
}
