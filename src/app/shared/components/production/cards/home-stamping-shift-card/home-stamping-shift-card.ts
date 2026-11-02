import { Component, computed, Input } from '@angular/core';
import { UpperCasePipe } from '@angular/common';
import { StampingShiftSummary } from '../stamping-shift-summary/stamping-shift-summary';
import { UiIcon } from '../../../../elements/ui-icon/ui-icon';

@Component({
  selector: 'app-home-stamping-shift-card',
  imports: [UiIcon, UpperCasePipe],
  host: { class: 'block' },
  templateUrl: './home-stamping-shift-card.html',
})
export class HomeStampingShiftCard extends StampingShiftSummary {
  private static readonly tileTitles = ['Encomendados', 'Meta', 'Acumuladas'];

  /** Parent is still fetching the active session. */
  @Input() loading = false;

  // Skeleton while the session loads and until the cards are built (config load is async).
  get showSkeleton(): boolean {
    return this.loading || !this.cards().length;
  }

  readonly dayEfficiency = computed(() => this.cards().find(c => c.title === 'Eficiencia'));
  readonly tiles = computed(() => this.cards().filter(c => HomeStampingShiftCard.tileTitles.includes(c.title)));
}
