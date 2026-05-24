import { Component } from '@angular/core';
import { Loader } from "../../shared/elements/loader/loader";

@Component({
  selector: 'app-auth-layout',
  imports: [Loader],
  templateUrl: './auth-layout.html',
  styleUrl: './auth-layout.css',
})
export class AuthLayout {
  readonly currentYear = new Date().getFullYear();
}
