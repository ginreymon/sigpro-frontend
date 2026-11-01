import { Component, model } from '@angular/core';

// Headless show/hide wrapper: the parent owns the trigger and binds [(open)].
@Component({
  selector: 'app-ui-collapsible',
  imports: [],
  templateUrl: './ui-collapsible.html',
  host: { class: 'block' },
})
export class UiCollapsible {
  readonly open = model(false);
}
