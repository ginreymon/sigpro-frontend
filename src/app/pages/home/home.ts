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

  ngOnInit() {
    const user = this.authService.getUser();
    if (!user) return;

    this.greeting = user.username ?? '';
    this.homeComponent = homeComponentMap[user.home_view ?? ''] ?? HomeDefault;
  }
}
