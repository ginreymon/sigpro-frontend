import { Injectable } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { BehaviorSubject, filter } from 'rxjs';
import { Option } from '../../models/core/option';
import { Module } from '../../models/core/module';

@Injectable({
  providedIn: 'root',
})
export class RouteContextService {
  private moduleSubject = new BehaviorSubject<any>(null);
  module$ = this.moduleSubject.asObservable();

  private optionSubject = new BehaviorSubject<any>(null);
  option$ = this.optionSubject.asObservable();

  private menu: Module[] = [];

  constructor(private router: Router) {
    this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe(() => {
      this.detectRoute();
    });
  }

  setMenu(menu: Module[], callback?: () => void) {
    this.menu = menu;
    this.detectRoute();
    callback?.();
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
