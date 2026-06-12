import { Component } from '@angular/core';
import { Loader } from "../../shared/elements/loader/loader";
import { AnimatedText } from "../../shared/elements/animated-text/animated-text";

@Component({
  selector: 'app-auth-layout',
  imports: [Loader, AnimatedText],
  templateUrl: './auth-layout.html',
  styleUrl: './auth-layout.css',
})
export class AuthLayout {
  readonly currentYear = new Date().getFullYear();
}
