import { Injectable } from '@angular/core';
import { NavigationEnd, Router, RoutesRecognized } from '@angular/router';
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
  private latestUrl: string;

  get currentModule(): Module | null {
    return this.moduleSubject.value;
  }

  constructor(private router: Router) {
    this.latestUrl = this.router.url;

    // RoutesRecognized fires before the target route's components are
    // constructed (NavigationEnd fires after), so the context is already
    // correct by the time a page reads `currentModule` in its constructor.
    this.router.events
      .pipe(filter((event): event is RoutesRecognized => event instanceof RoutesRecognized))
      .subscribe((event) => {
        this.latestUrl = event.urlAfterRedirects;
        this.detectRoute();
      });

    this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe((event) => {
      this.latestUrl = (event as NavigationEnd).urlAfterRedirects;
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

    const path = this.latestUrl.split('?')[0].split('#')[0];
    const segments = path.split('/').filter(Boolean);

    const module = this.menu.find((m) => m.url === segments[0]);

    const option = module?.options?.find((op: Option) => op.url === segments[1]);

    this.moduleSubject.next(module);
    this.optionSubject.next(option);
  }
}
