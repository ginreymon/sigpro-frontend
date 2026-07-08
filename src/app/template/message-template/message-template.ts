import { Component, Input } from '@angular/core';
import { UiIcon } from '../../shared/elements/ui-icon/ui-icon';

@Component({
  selector: 'app-message-template',
  imports: [UiIcon],
  templateUrl: './message-template.html',
  styleUrl: './message-template.css',
})
export class MessageTemplate {
  @Input() code = '';
  @Input() title = '';
  @Input() description = '';
  @Input() illustrationIcon = '';
  @Input() badgeIcon = '';
  @Input() badgeLabel = '';
}
