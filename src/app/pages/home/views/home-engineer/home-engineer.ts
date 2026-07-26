import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TitleCasePipe } from '@angular/common';
import { Subscription } from 'rxjs';
import { UiIcon } from '../../../../shared/elements/ui-icon/ui-icon';
import { MenuService } from '../../../../services/core/menu-service';
import { Module } from '../../../../models/core/module';

interface AreaTile {
  name: string;
  routerLink: string;
  iconName: string;
}

// Module.url -> icon. No hay campo de icono en el modelo, se mapea acá; los módulos
// sin entrada usan DEFAULT_ICON.
const MODULE_ICONS: Record<string, string> = {
  production: 'chartArea',
  stamping: 'hammer',
  catalog: 'file',
  admin: 'screwdriverWrench',
  configuration: 'screwdriverWrench',
};
const DEFAULT_ICON = 'file';

@Component({
  selector: 'app-home-engineer',
  imports: [UiIcon, RouterLink, TitleCasePipe],
  templateUrl: './home-engineer.html',
  styleUrl: './home-engineer.css',
})
export class HomeEngineer implements OnInit, OnDestroy {
  readonly areas = signal<AreaTile[]>([]);

  private menuService = inject(MenuService);
  private menuSub?: Subscription;

  ngOnInit(): void {
    this.menuSub = this.menuService.menu$.subscribe((menu) => {
      this.areas.set(this.buildAreas(menu ?? []));
    });
  }

  ngOnDestroy(): void {
    this.menuSub?.unsubscribe();
  }

  private buildAreas(menu: Module[]): AreaTile[] {
    return menu
      .filter((mod) => mod.state && mod.url && mod.options?.some((op) => op.visible && op.state))
      .sort((a, b) => a.order - b.order)
      .map((mod) => {
        const visibleOptions = (mod.options ?? []).filter((op) => op.visible && op.state);
        const targetOption =
          visibleOptions.find((op) => op.is_home_target) ??
          [...visibleOptions].sort((a, b) => a.order - b.order)[0];

        return {
          name: mod.name,
          routerLink: `/${mod.url}/${targetOption?.url}`,
          iconName: MODULE_ICONS[mod.url ?? ''] ?? DEFAULT_ICON,
        };
      });
  }
}
