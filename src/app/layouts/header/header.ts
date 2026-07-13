import { Component, ElementRef, HostListener, OnInit, signal } from '@angular/core';
import { AuthService } from '../../services/auth/auth-service';
import { UiHeaderMenuItem } from '../../shared/elements/ui-header-menu-item/ui-header-menu-item';
import { LocationOption } from '../../common/classes/location-option';
import { RouterLink } from '@angular/router';
import { UiIcon } from '../../shared/elements/ui-icon/ui-icon';
import { TitleCasePipe } from '@angular/common';

@Component({
  selector: 'app-header',
  imports: [UiHeaderMenuItem, RouterLink, UiIcon, TitleCasePipe],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header extends LocationOption implements OnInit {  
  showUserMenu = signal(false);

  constructor(private authService: AuthService,private elementRef: ElementRef) {
    super();
  }

  @HostListener('document:click', ['$event'])
  handleClickOutside(event: MouseEvent) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.showUserMenu.set(false);
    }
  }

  get showMenu() {
    return this.menuService.showMenu;
  }

  toggleMenu() {
    this.menuService.showMenu = !this.menuService.showMenu;
  }

  toggleShowUserMenu(){
    const value = this.showUserMenu();
    this.showUserMenu.set(!value);
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

  getOptionName() {
    return !this.option ? '' : `${this.option.name}`;
  }
}
