import { Component, input, model } from '@angular/core';
import { UiIcon } from '../ui-icon/ui-icon';

// Disclosure triangle: a header row with a triangle that rotates when the section is open.
// The header goes in `[disclosure-header]` and the collapsible content in `[disclosure-body]`.
// `expanded` is a two-way model, so the parent can control it or leave it to the component.
@Component({
  selector: 'app-ui-disclosure-triangle',
  imports: [UiIcon],
  templateUrl: './ui-disclosure-triangle.html',
})
export class UiDisclosureTriangle {
  readonly expanded = model(false);
  readonly disabled = input(false);

  protected toggle(): void {
    if (!this.disabled()) this.expanded.update((value) => !value);
  }
}
