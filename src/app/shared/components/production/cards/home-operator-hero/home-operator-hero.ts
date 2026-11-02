import { Component, Input } from '@angular/core';
import { UiIcon } from '../../../../elements/ui-icon/ui-icon';

/** Hero band for the process homes: process identity (icon, title, description) + projected cards. */
@Component({
  selector: 'app-home-operator-hero',
  imports: [UiIcon],
  templateUrl: './home-operator-hero.html',
})
export class HomeOperatorHero {
  @Input() iconName = '';
  @Input() title = '';
  @Input() description: string | null = '';
  /** Title/description still resolving: show a skeleton instead of the fallback title. */
  @Input() loading = false;
}
