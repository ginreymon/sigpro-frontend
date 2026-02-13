import { Component, OnInit } from '@angular/core';
import { MenuService } from '../../services/core/menu-service';
import { Module } from '../../models/core/module';
import { map } from 'rxjs';
import { Router } from '@angular/router';

@Component({
  selector: 'app-menu',
  imports: [],
  templateUrl: './menu.html',
  styleUrl: './menu.css',
})
export class Menu implements OnInit {
  modules: Module[] = [];
  menuReady: boolean = false;

  constructor(
    private menuService: MenuService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.initialize();
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.menuReady = true;
    });
  }

  get showMenu() {
    return this.menuService.showMenu;
  }

  initialize() {
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

  navigate(module_url: string | null, option_url: string | null) {
    if (!module_url || !option_url) {
      return;
    }
    this.menuService.showMenu = false;
    this.router.navigateByUrl(`${module_url}/${option_url}`);
  }
}
