import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ErrorPage } from '../../layouts/error-page/error-page';
import { UiIcon } from '../../shared/elements/ui-icon/ui-icon';

@Component({
  selector: 'app-not-authorized',
  imports: [RouterLink, ErrorPage, UiIcon],
  templateUrl: './not-authorized.html',
  styleUrl: './not-authorized.css',
})
export class NotAuthorized {}
