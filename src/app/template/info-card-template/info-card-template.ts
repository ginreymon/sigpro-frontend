import { Component, Input } from '@angular/core';
import { UiIcon } from '../../shared/elements/ui-icon/ui-icon';

@Component({
  selector: 'app-info-card-template',
  imports: [UiIcon],
  templateUrl: './info-card-template.html',
  styleUrl: './info-card-template.css',
})
export class InfoCardTemplate {
  @Input() title: string | null = null;
  @Input() description: string | null = null;
  @Input() icon: string = 'calendar';
}
