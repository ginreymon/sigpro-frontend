import { Component, OnInit, signal, Type } from '@angular/core';
import { NgComponentOutlet } from '@angular/common';
import { AuthService } from '../../services/auth/auth-service';
import { homeComponentMap, homeDefaultLoader } from '../../routes/home-component-map';

@Component({
  selector: 'app-home',
  imports: [NgComponentOutlet],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit {
  greeting = '';
  homeComponent = signal<Type<any> | null>(null);

  constructor(private authService: AuthService) { }

  private getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  }

  async ngOnInit() {
    const user = this.authService.getUser();
    if (!user) return; 

    this.greeting = `${this.getGreeting()},`;
    this.homeComponent.set(await (homeComponentMap[user.home_view ?? ''] ?? homeDefaultLoader)());
  }

  get username() {
    const user = this.authService.getUser();
    if (!user) return '';
    return `${user.username ?? ''}`
  }
}
