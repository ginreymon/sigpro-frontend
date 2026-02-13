import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment.development';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Module } from '../../models/core/module';

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

  set showMenu(value:boolean){
    this.showMenuSubject.next(value);
  }


  constructor(private http: HttpClient) {
    const savedMenu = localStorage.getItem('menu');
    if (savedMenu) {
      this.menuSubject.next(JSON.parse(savedMenu));
    }
  }

  loadMenu(): Observable<any> {
    return this.http.get(this.path).pipe(
      tap((menu) => {
        this.menuSubject.next(menu as Module[]);
        localStorage.setItem('menu', JSON.stringify(menu));
      }),
    );
  }

  getMenuValue(): Module[] | null {
    return this.menuSubject.value;
  }
}
