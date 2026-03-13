import { Component, OnInit } from '@angular/core';
import { Module } from '../../models/core/module';
import { map } from 'rxjs';
import { Router } from '@angular/router';
import { Option } from '../../models/core/option';
import { LocationOption } from '../../common/classes/location-option';

@Component({
  selector: 'app-menu',
  imports: [],
  templateUrl: './menu.html',
  styleUrl: './menu.css',
})
export class Menu extends LocationOption implements OnInit {
  menuReady: boolean = false;

  constructor(private router: Router) {
    super();
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.menuReady = true;
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

  navigate(module: Module, option: Option) {
    if (!module || !option) return;

    this.menuService.showMenu = false;
    this.router.navigateByUrl(`${module.url}/${option.url}`);
  }
}
