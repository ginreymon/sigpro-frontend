import { Directive, inject, OnInit } from '@angular/core';
import { MenuService } from '../../services/core/menu-service';
import { RouteContextService } from '../../services/core/route-context-service';
import { Module } from '../../models/core/module';
import { map } from 'rxjs';

@Directive()
export abstract class LocationOption implements OnInit {
  private _module: any = null;
  private _option: any = null;
  protected modules: Module[] = [];
  protected menuService: MenuService = inject(MenuService);
  protected routeCtxService: RouteContextService = inject(RouteContextService);

  ngOnInit(): void {
    this.initialize();
  }

  get module(): any {
    return this._module;
  }

  get option(): any {
    return this._option;
  }

  private initialize() {
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
          this.modules = menu ? (menu as Module[]) : [];

          this.routeCtxService.setMenu(this.modules, () => {
            this.routeCtxService.module$.subscribe((m) => (this._module = m));
            this.routeCtxService.option$.subscribe((o) => (this._option = o));
          });
        },
      });
  }
}
