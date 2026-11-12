import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { AREA_PANELS, AreaKey } from '../../common/config/area-panel-config';
import { MenuService } from './menu-service';

@Injectable({
  providedIn: 'root',
})
export class AreaPanelService {
  private router = inject(Router);
  private menu = toSignal(inject(MenuService).menu$, { initialValue: null });

  config(area: AreaKey) {
    return AREA_PANELS[area];
  }

  /** True when the user's menu includes the area panel AND the sidebar shows it (`visible`), so button and sidebar always agree. */
  canOpen(area: AreaKey): boolean {
    const route = AREA_PANELS[area].route;
    return !!this.menu()?.some((m) => m.options?.some((o) => o.visible && `${m.url}/${o.url}` === route));
  }

  /** Navigation is still enforced by accessGuard; hiding the button is only UX. */
  open(area: AreaKey): void {
    this.router.navigateByUrl(AREA_PANELS[area].route);
  }
}
