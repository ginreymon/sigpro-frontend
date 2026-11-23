import { Component, Input } from '@angular/core';
import { UiIcon } from '../../shared/elements/ui-icon/ui-icon';

// Layout de la pantalla de actualización. Misma estructura visual que
// ErrorPage (cabecera, fondo, tarjeta, pie), con una ilustración animada y un
// único espacio [actions] para el botón.
@Component({
  selector: 'app-update-page',
  imports: [UiIcon],
  templateUrl: './update-page.html',
})
export class UpdatePage {
  @Input() title = '';
  @Input() description = '';
  @Input() badgeLabel = '';
  @Input() versionLabel = '';

  readonly currentYear = new Date().getFullYear();
}
