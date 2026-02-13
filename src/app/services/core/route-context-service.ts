import { Injectable } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { BehaviorSubject, filter } from 'rxjs';
import { Option } from '../../models/core/option';

@Injectable({
  providedIn: 'root',
})
export class RouteContextService {
  private moduleSubject = new BehaviorSubject<any>(null);
  module$ = this.moduleSubject.asObservable();

  private optionSubject = new BehaviorSubject<any>(null);
  option$ = this.optionSubject.asObservable();

  private menu: any[] = [];

  constructor(private router: Router) {
    this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe(() => {
      this.detectRoute();
    });
  }

  setMenu(menu: any[]) {
    this.menu = menu;
    this.detectRoute();
  }

  private detectRoute() {
    if (!this.menu.length) return;

    const segments = this.router.url.split('/').filter(Boolean);

    const module = this.menu.find((m) => m.url === segments[0]);

    const option = module?.options?.find((op: Option) => op.url === segments[1]);

    this.moduleSubject.next(module);
    this.optionSubject.next(option);
  }
}
