import { Component, input, model } from '@angular/core';
import { UiIcon } from '../../../elements/ui-icon/ui-icon';

let nextId = 0;

@Component({
  selector: 'app-collapsible-layout',
  imports: [UiIcon],
  templateUrl: './collapsible-layout.html',
  styleUrl: './collapsible-layout.css',
})
export class CollapsibleLayout {
  readonly title = input.required<string>();
  /** Two-way bindable: `[(open)]`. Uncontrolled usage works too. */
  readonly open = model(true);

  protected readonly contentId = `collapsible-content-${nextId++}`;

  protected toggle(): void {
    this.open.update((value) => !value);
  }
}
