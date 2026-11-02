import { Component, Input } from '@angular/core';
import { UiIcon } from '../../../../elements/ui-icon/ui-icon';

/** Shared empty / error state for the home shift slot (same shell as the shift cards). */
@Component({
  selector: 'app-home-state-card',
  imports: [UiIcon],
  host: { class: 'block' },
  templateUrl: './home-state-card.html',
})
export class HomeStateCard {
  @Input() variant: 'empty' | 'error' = 'empty';
  @Input() title = '';
  @Input() message = '';
}
