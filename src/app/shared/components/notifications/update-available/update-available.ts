import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BUILD_VERSION } from '../../../../../environments/build-info';
import { UpdatePage } from '../../../../layouts/update-page/update-page';
import { UpdateService } from '../../../../services/common/update-service';
import { UiIcon } from '../../../elements/ui-icon/ui-icon';

@Component({
  selector: 'app-update-available',
  imports: [UpdatePage, UiIcon],
  templateUrl: './update-available.html',
})
export class UpdateAvailable {
  protected updateService = inject(UpdateService);
  protected readonly version = BUILD_VERSION;

  // La ruta /app-update (ver app.routes.ts) muestra siempre la pantalla,
  // sin esperar a que haya una versión nueva.
  protected alwaysVisible = !!inject(ActivatedRoute).snapshot.data['alwaysVisible'];
}
