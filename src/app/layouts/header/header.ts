import { Component, ElementRef, HostListener, OnInit, inject, signal } from '@angular/core';
import { finalize } from 'rxjs';
import { WorkSessionService } from '../../services/production/work-session-service';
import { LoaderService } from '../../services/common/loader-service';
import { DialogService } from '../../services/common/dialog-service';
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
  private loggingOut = false;
  private workSessionService = inject(WorkSessionService);
  private loaderService = inject(LoaderService);
  private dialogService = inject(DialogService);

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
    if (this.loggingOut) return;
    this.loggingOut = true;
    this.loaderService.showLoader();
    this.workSessionService
      .closeActive()
      .pipe(
        finalize(() => {
          this.loggingOut = false;
          this.loaderService.hideLoader();
        }),
      )
      .subscribe({
        next: () => this.authService.logout(),
        error: () =>
          this.dialogService.openToast(
            'Error',
            'No se pudo cerrar la jornada. Intente de nuevo antes de cerrar sesión.',
          ),
      });
  }

  getOptionName() {
    return !this.option ? '' : `${this.option.name}`;
  }
}
