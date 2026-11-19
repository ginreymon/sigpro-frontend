import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Location } from '@angular/common';
import { ErrorPage } from '../../layouts/error-page/error-page';
import { UiIcon } from '../../shared/elements/ui-icon/ui-icon';

@Component({
  selector: 'app-not-found',
  imports: [ErrorPage, UiIcon],
  templateUrl: './not-found.html',
  styleUrl: './not-found.css',
})
export class NotFound {
  private location = inject(Location);
  private router = inject(Router);

  goBack() {
    this.location.back();
  }

  goHome() {
    this.router.navigateByUrl('/');
  }
}
