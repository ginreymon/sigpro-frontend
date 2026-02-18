import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment.development';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Module } from '../../models/core/module';
import { Router } from '@angular/router';
import { Layout } from '../../layouts/layout/layout';
import { getDynamicRoutes } from '../../routes/get-dynamic-routes';

@Injectable({
  providedIn: 'root',
})
export class MenuService {
  private path: string = `${environment.BASE_API_URL}/core/menu/`;

  private menuSubject = new BehaviorSubject<Module[] | null>(null);
  public menu$ = this.menuSubject.asObservable();

  private showMenuSubject = new BehaviorSubject<boolean>(false);

  get showMenu() {
    return this.showMenuSubject.value;
  }

  set showMenu(value: boolean) {
    this.showMenuSubject.next(value);
  }

  constructor(
    private http: HttpClient,
    private router: Router,
  ) {
    const savedMenu = localStorage.getItem(environment.MENU_NAME);
    if (savedMenu) {
      this.menuSubject.next(JSON.parse(savedMenu));
    }
  }

  loadMenu(): Observable<any> {
    return this.http.get(this.path).pipe(
      tap((menu) => {
        this.menuSubject.next(menu as Module[]);
        localStorage.setItem(environment.MENU_NAME, JSON.stringify(menu));
        this.ensureDynamicRoutes();
      }),
    );
  }

  getMenuValue(): Module[] | null {
    return this.menuSubject.value;
  }

  ensureDynamicRoutes() {
    const menu = this.getMenuValue();
    if (!menu?.length) return;

    const currentConfig = this.router.config;

    const layoutRoute = currentConfig.find((r) => r.component === Layout);

    if (!layoutRoute) return;

    const dynamicRoutes = getDynamicRoutes();

    const alreadyLoaded = layoutRoute.children && layoutRoute.children.length > 1;
    if (alreadyLoaded) return;

    const newConfig = currentConfig.map((r) => {
      if (r.component !== Layout) return r;

      return {
        ...r,
        children: [...(r.children ?? []), ...dynamicRoutes],
      };
    });

    this.router.resetConfig(newConfig);
  }
}
