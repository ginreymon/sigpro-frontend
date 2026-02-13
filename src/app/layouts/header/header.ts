import { Component } from '@angular/core';
import { MenuService } from '../../services/core/menu-service';
import { AuthService } from '../../services/auth/auth-service';
import { HeaderMenuItem } from '../../shared/elements/header-menu-item/header-menu-item';

@Component({
  selector: 'app-header',
  imports: [HeaderMenuItem],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header {
  constructor(
    private menuService: MenuService,
    private authService: AuthService,
  ) {}

  get showMenu() {
    return this.menuService.showMenu;
  }

  toggleMenu() {
    this.menuService.showMenu = !this.menuService.showMenu;    
  }

  getUser(){
    const user = this.authService.getUser();
    if (!user) return 'Usuario';

    return `${user.username} / ${user.groups[0]}`;
  }

  logout(){
    this.authService.logout();
  }
}
