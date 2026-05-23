import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Location } from '@angular/common';
import { ErrorPage } from '../../layouts/error-page/error-page';
import { UiIcon } from '../../shared/elements/ui-icon/ui-icon';
import { AuthService } from '../../services/auth/auth-service';

@Component({
  selector: 'app-not-found',
  imports: [RouterLink, ErrorPage, UiIcon],
  templateUrl: './not-found.html',
  styleUrl: './not-found.css',
})
export class NotFound {
  private location = inject(Location);
  private authService = inject(AuthService);

  goBack() {
    this.location.back();
  }

  goHome() {
    this.authService.logout();
  }
}
