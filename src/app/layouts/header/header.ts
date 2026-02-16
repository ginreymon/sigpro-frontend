import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth/auth-service';
import { HeaderMenuItem } from '../../shared/elements/header-menu-item/header-menu-item';
import { LocationOption } from '../../common/classes/location-option';

@Component({
  selector: 'app-header',
  imports: [HeaderMenuItem],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header extends LocationOption implements OnInit {
  constructor(private authService: AuthService) {
    super();
  }

  ngOnInit(): void {
    this.initialize();
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

    return `${user.username}`;
  }

  logout() {
    this.authService.logout();
  }

  getAppLocation() {
    return !this.module || !this.option ? '' : ` > ${this.module.name} > ${this.option.name}`;
  }
}
