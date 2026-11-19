import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ErrorPage } from '../../layouts/error-page/error-page';
import { UiIcon } from '../../shared/elements/ui-icon/ui-icon';

@Component({
  selector: 'app-not-authorized',
  imports: [RouterLink, ErrorPage, UiIcon],
  templateUrl: './not-authorized.html',
  styleUrl: './not-authorized.css',
})
export class NotAuthorized {
  private router = inject(Router);

  goHome() {
    this.router.navigateByUrl('/');
  }
}
