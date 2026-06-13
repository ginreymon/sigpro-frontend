import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Module } from '../../models/core/module';
import { Router } from '@angular/router';
import { Option } from '../../models/core/option';
import { LocationOption } from '../../common/classes/location-option';
import { TitleCasePipe } from '@angular/common';

@Component({
  selector: 'app-menu',
  imports: [TitleCasePipe],
  templateUrl: './menu.html',
  styleUrl: './menu.css',
})
export class Menu extends LocationOption implements OnInit {
  menuReady: boolean = false;

  constructor(private router: Router, private cdr: ChangeDetectorRef) {
    super();
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.menuReady = true;
      this.cdr.detectChanges();
    }, 500);
  }

  get showMenu() {
    return this.menuService.showMenu;
  }

  toggleModule(module: Module) {
    if (module.state) {
      module.state = false;
      return;
    }
    this.modules.forEach((mod) => {
      mod.state = mod.id == module.id;
    });
  }

  closeMenu(): void {
    this.menuService.showMenu = false;
  }

  navigate(module: Module, option: Option) {
    if (!module || !option) return;
    const url = option.url?.includes('/') ? option.url : `${module.url}/${option.url}`;
    this.menuService.showMenu = false;
    this.router.navigateByUrl(url);
  }
}
