import { Component, OnInit } from '@angular/core';
import { MenuService } from '../../services/core/menu-service';
import { AuthService } from '../../services/auth/auth-service';
import { HeaderMenuItem } from '../../shared/elements/header-menu-item/header-menu-item';
import { RouteContextService } from '../../services/core/route-context-service';

@Component({
  selector: 'app-header',
  imports: [HeaderMenuItem],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header implements OnInit {
  module: any = null;
  option: any = null;

  constructor(
    private menuService: MenuService,
    private authService: AuthService,
    private routeCtxService: RouteContextService,
  ) {}

  ngOnInit(): void {
    this.initialize();
  }

  initialize() {
    this.menuService.menu$.subscribe({
      next: (menu) => this.routeCtxService.setMenu(menu || []),
    });
    this.routeCtxService.module$.subscribe((m) => (this.module = m));
    this.routeCtxService.option$.subscribe((o) => (this.option = o));
  }

  get showMenu() {
    return this.menuService.showMenu;
  }

  toggleMenu() {
    this.menuService.showMenu = !this.menuService.showMenu;
  }

  getUser() {
    const user = this.authService.getUser();
    if (!user) return 'Usuario';

    return `${user.username} / ${user.groups[0]}`;
  }

  logout() {
    this.authService.logout();
  }

  getAppLocation() {
    return !this.module || !this.option ? '' : ` > ${this.module.name} > ${this.option.name}`;
  }
}
