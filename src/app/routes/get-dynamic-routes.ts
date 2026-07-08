import { Route } from '@angular/router';
import { environment } from '../../environments/environment';
import { accessGuard } from '../guards/access-guard';
import { Module } from '../models/core/module';
import { componentMap } from './component-map';
import { RouteUnavailable } from '../template/route-unavailable/route-unavailable';

export function getDynamicRoutes(): Route[] {
  const savedMenu = localStorage.getItem(environment.MENU_NAME);
  const menu = savedMenu ? (JSON.parse(savedMenu) as Module[]) : [];

  return menu.map((mod) => {
    const children = mod.options?.map((op) => {
      const key = `${mod.url}/${op.url}`;
      const component = componentMap[key];
      
      return {
        path: op.url,
        component: component ?? RouteUnavailable,
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
