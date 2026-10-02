import { Component, computed, input } from '@angular/core';
import { originBadge } from '../../../common/functions/origin-badge';

@Component({
  selector: 'app-ui-origin-badge',
  imports: [],
  templateUrl: './ui-origin-badge.html',
})
export class UiOriginBadge {
  readonly originId = input<number | null | undefined>(null);
  readonly label = input<string>('');

  protected readonly badge = computed(() => originBadge(this.originId()));
}
