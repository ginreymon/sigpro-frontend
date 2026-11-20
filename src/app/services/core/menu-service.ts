import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
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
  // Read lazily: BASE_API_URL is resolved by an app initializer after this service may be created.
  private get path(): string {
    return `${environment.BASE_API_URL}/core/menu/`;
  }

  private menuSubject = new BehaviorSubject<Module[] | null>(null);
  public menu$ = this.menuSubject.asObservable();

  private showMenuSubject = new BehaviorSubject<boolean>(false);

  constructor(
    private http: HttpClient,
    private router: Router,
  ) {
    const savedMenu = localStorage.getItem(environment.MENU_NAME);
    if (savedMenu) {
      this.menuSubject.next(JSON.parse(savedMenu));
    }
  }

  get showMenu() {
    return this.showMenuSubject.value;
  }

  set showMenu(value: boolean) {
    this.showMenuSubject.next(value);
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

  ensureDynamicRoutes() {
    if (!this.menuSubject.value?.length) return;

    const currentConfig = this.router.config;
    const layoutRoute = currentConfig.find((r) => r.component === Layout);
    if (!layoutRoute) return;

    const baseChildren = (layoutRoute.children ?? []).filter(c => c.pathMatch === 'full');
    const dynamicRoutes = getDynamicRoutes();

    const newConfig = currentConfig.map((r) => {
      if (r.component !== Layout) return r;
      return { ...r, children: [...baseChildren, ...dynamicRoutes] };
    });

    this.router.resetConfig(newConfig);
  }

  clearDynamicRoutes() {
    this.menuSubject.next(null);
    const currentConfig = this.router.config;
    const newConfig = currentConfig.map((r) => {
      if (r.component !== Layout) return r;
      const baseChildren = (r.children ?? []).filter(c => c.pathMatch === 'full');
      return { ...r, children: baseChildren };
    });
    this.router.resetConfig(newConfig);
  }
}
