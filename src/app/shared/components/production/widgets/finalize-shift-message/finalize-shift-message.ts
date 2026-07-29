import { Component, output } from '@angular/core';
import { InfoCardTemplate } from '../../../../../template/info-card-template/info-card-template';
import { UiButton } from '../../../../elements/ui-button/ui-button';
import { UiIcon } from '../../../../elements/ui-icon/ui-icon';

@Component({
  selector: 'app-finalize-shift-message',
  standalone: true,
  imports: [InfoCardTemplate, UiButton, UiIcon],
  templateUrl: './finalize-shift-message.html',
  host: { class: '-m-6 h-[calc(100vh-4rem)] flex items-center justify-center' },
})
export class FinalizeShiftMessage {
  onClose = output<void>();
}
