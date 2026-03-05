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
  modules: Module[] = [];
  menuReady: boolean = false;

  constructor(private router: Router) {
    super();
  }

  ngOnInit(): void {
    this.initialize();
    this.initializeMenu();
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.menuReady = true;
    }, 500);
  }

  get showMenu() {
    return this.menuService.showMenu;
  }

  initializeMenu() {
    this.menuService.menu$
      .pipe(
        map((menu) => {
          if (!menu) return [];
          return (menu as Module[])
            .map((mod) => {
              const sortedOptions = mod.options
                ? [...mod.options].sort((a, b) => a.order - b.order)
                : [];
              return { ...mod, options: sortedOptions, state: false };
            })
            .sort((a, b) => a.order - b.order);
        }),
      )
      .subscribe({
        next: (menu) => {
          this.modules = menu as Module[];
        },
      });
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
