import { Component, Input } from '@angular/core';
import { UiIcon } from '../../shared/elements/ui-icon/ui-icon';

@Component({
  selector: 'app-error-page',
  imports: [UiIcon],
  templateUrl: './error-page.html',
})
export class ErrorPage {
  @Input() code = '';
  @Input() title = '';
  @Input() description = '';
  @Input() errorId = '';
  @Input() illustrationIcon = '';
  @Input() badgeIcon = '';
  @Input() badgeLabel = '';

  readonly currentYear = new Date().getFullYear();
}
