import { Component, Input } from '@angular/core';
import { UiIcon } from '../../../shared/elements/ui-icon/ui-icon';

@Component({
  selector: 'app-unplanned-shift-message',
  imports: [UiIcon],
  templateUrl: './unplanned-shift-message.html',
  styleUrl: './unplanned-shift-message.css',
})
export class UnplannedShiftMessage {
  @Input() title: string | null = null;
  @Input() description: string | null = null;
  @Input() icon: string = 'calendar';
}
