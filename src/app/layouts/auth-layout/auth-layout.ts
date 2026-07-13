import { Component } from '@angular/core';
import { UiLoader } from "../../shared/elements/ui-loader/ui-loader";
import { UiAnimatedText } from "../../shared/elements/ui-animated-text/ui-animated-text";

@Component({
  selector: 'app-auth-layout',
  imports: [UiLoader, UiAnimatedText],
  templateUrl: './auth-layout.html',
  styleUrl: './auth-layout.css',
})
export class AuthLayout {
  readonly currentYear = new Date().getFullYear();
}
