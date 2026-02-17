import { Route } from '@angular/router';
import { environment } from '../../environments/environment';
import { accessGuard } from '../guards/access-guard';
import { Module } from '../models/core/module';
import { componentMap } from './component-map';

export function getDynamicRoutes(): Route[] {
  const savedMenu = localStorage.getItem(environment.MENU_NAME);
  const menu = savedMenu ? (JSON.parse(savedMenu) as Module[]) : [];

  return menu.map((mod) => {
    const children = mod.options?.map((op) => {
      return {
        path: op.url,
        component: componentMap[`${mod.url}/${op.url}`],
        canActivate: [accessGuard],
        data: { optionId: op.id },
      };
    });

    return {
      path: mod.url,
      children,
    } as Route;
  });
}
