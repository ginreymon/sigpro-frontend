import { Component, OnInit, Type } from '@angular/core';
import { NgComponentOutlet } from '@angular/common';
import { AuthService } from '../../services/auth/auth-service';
import { homeComponentMap, HomeDefault } from '../../routes/home-component-map';

@Component({
  selector: 'app-home',
  imports: [NgComponentOutlet],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit {
  greeting = '';
  homeComponent: Type<any> = HomeDefault;

  constructor(private authService: AuthService) { }

  private getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  }

  ngOnInit() {
    const user = this.authService.getUser();
    if (!user) return; 

    this.greeting = `${this.getGreeting()},`;
    this.homeComponent = homeComponentMap[user.home_view ?? ''] ?? HomeDefault;
  }

  get username() {
    const user = this.authService.getUser();
    if (!user) return '';
    return `${user.username ?? ''}`
  }
}
