import { inject } from '@angular/core';
import { MenuService } from '../../services/core/menu-service';
import { RouteContextService } from '../../services/core/route-context-service';

export class LocationOption {
  protected module: any = null;
  protected option: any = null;
  protected menuService: MenuService = inject(MenuService);
  protected routeCtxService: RouteContextService = inject(RouteContextService);

  constructor() {}

  initialize() {
    this.menuService.menu$.subscribe({
      next: (menu) => this.routeCtxService.setMenu(menu || []),
    });
    this.routeCtxService.module$.subscribe((m) => (this.module = m));
    this.routeCtxService.option$.subscribe((o) => (this.option = o));
  }
}
