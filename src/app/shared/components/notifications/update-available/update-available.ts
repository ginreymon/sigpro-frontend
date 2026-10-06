import { Component, inject } from '@angular/core';
import { UpdateService } from '../../../../services/common/update-service';
import { UiButton } from '../../../elements/ui-button/ui-button';

@Component({
  selector: 'app-update-available',
  imports: [UiButton],
  templateUrl: './update-available.html',
})
export class UpdateAvailable {
  protected updateService = inject(UpdateService);
}
