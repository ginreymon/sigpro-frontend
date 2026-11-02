import { Component, EventEmitter, Input, Output } from '@angular/core';
import { UiIcon } from '../../../../elements/ui-icon/ui-icon';
import { UiButton } from '../../../../elements/ui-button/ui-button';

/**
 * Home call-to-action card ("start / continue shift"). Same shell, header height and
 * line heights as the shift cards so the loading skeleton matches the final content.
 */
@Component({
  selector: 'app-home-action-card',
  imports: [UiIcon, UiButton],
  host: { class: 'block' },
  templateUrl: './home-action-card.html',
})
export class HomeActionCard {
  @Input() loading = false;
  @Input() hasPending = false;
  /** Text shown when there is no shift in progress. */
  @Input() idleText = '';
  @Output() action = new EventEmitter<void>();
}
