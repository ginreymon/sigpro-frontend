import { Component, input, model } from '@angular/core';
import { UiIcon } from '../ui-icon/ui-icon';

// Self-contained panel: bordered card with a clickable header and projected body.
@Component({
  selector: 'app-ui-expandable-panel',
  imports: [UiIcon],
  templateUrl: './ui-expandable-panel.html',
  host: { class: 'block' },
})
export class UiExpandablePanel {
  readonly title = input('');
  readonly expanded = model(false);

  protected toggle(): void {
    this.expanded.update((value) => !value);
  }
}
